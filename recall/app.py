import os, json, re, zipfile, shutil, base64, hashlib, mimetypes, unicodedata, tempfile, time
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse, FileResponse, JSONResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build

os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")
os.environ.setdefault("OAUTHLIB_RELAX_TOKEN_SCOPE", "1")

BASE=Path(__file__).resolve().parent
STORE=BASE/"storage"; STORE.mkdir(exist_ok=True)
CRED=BASE/"credentials.json"; ACC=STORE/"gmail_accounts.json"
WA_JSON=STORE/"whatsapp.json"; LINKS_JSON=STORE/"links.json"; FILES_JSON=STORE/"files.json"
SCOPES=["https://www.googleapis.com/auth/gmail.readonly"]
REDIRECT="http://127.0.0.1:8000/auth/gmail/callback"
VERSION="2.9-classement"
GMAIL_FETCH_LIMIT=50
FLOWS={}

def norm(t):
    t=unicodedata.normalize("NFD",str(t or ""))
    return "".join(c for c in t if unicodedata.category(c)!="Mn").lower()
def hid(*v): return hashlib.sha1("|".join(map(str,v)).encode()).hexdigest()
def loadj(p, default): 
    try:return json.loads(p.read_text(encoding="utf-8"))
    except:return default
def atomic_json(p, data):
    p.parent.mkdir(parents=True,exist_ok=True)
    fd,tmp=tempfile.mkstemp(prefix=p.stem+"_",suffix=".tmp",dir=str(p.parent))
    try:
        with os.fdopen(fd,"w",encoding="utf-8") as f:
            json.dump(data,f,ensure_ascii=False,indent=2); f.flush(); os.fsync(f.fileno())
        for _ in range(8):
            try: os.replace(tmp,p); return
            except PermissionError: time.sleep(.15)
        shutil.copyfile(tmp,p); os.remove(tmp)
    finally:
        if os.path.exists(tmp):
            try: os.remove(tmp)
            except: pass
def load_accounts(): return loadj(ACC,[])
def save_accounts(x): atomic_json(ACC,x)
def load_files(): return loadj(FILES_JSON,[])
def save_files(x): atomic_json(FILES_JSON,x)
def load_wa(): return loadj(WA_JSON,[])
def save_wa(x): atomic_json(WA_JSON,x)
def load_links(): return loadj(LINKS_JSON,[])
def save_links(x): atomic_json(LINKS_JSON,x)

def new_flow(state=None):
    f=Flow.from_client_secrets_file(str(CRED),scopes=SCOPES,redirect_uri=REDIRECT,state=state or None)
    f.autogenerate_code_verifier=False; f.code_verifier=None
    return f
def persist(a):
    xs=load_accounts()
    for i,z in enumerate(xs):
        if z["id"]==a["id"]: xs[i]=a; save_accounts(xs); return
    xs.append(a); save_accounts(xs)
def account_creds(a):
    c=Credentials.from_authorized_user_info(a["credentials"],SCOPES)
    if c.expired and c.refresh_token:
        c.refresh(GoogleRequest()); a["credentials"]=json.loads(c.to_json()); persist(a)
    return c
def service(a): return build("gmail","v1",credentials=account_creds(a))
def headers(p): return {h["name"].lower():h["value"] for h in p.get("headers",[])}
def decode64(s):
    try:return base64.urlsafe_b64decode(s.encode()+b"===" ).decode("utf-8","ignore")
    except:return ""
def walk(part,texts,atts):
    mime=part.get("mimeType",""); body=part.get("body",{}); fn=part.get("filename","")
    if fn and body.get("attachmentId"): atts.append((fn,mime,body["attachmentId"]))
    if body.get("data") and mime in ("text/plain","text/html"): texts.append(decode64(body["data"]))
    for p in part.get("parts",[]): walk(p,texts,atts)
def classify(path):
    ext=path.suffix.lower()
    if ext==".pdf": return "documents"
    if ext in (".jpg",".jpeg",".png",".gif",".webp",".heic"): return "images"
    return "autres_fichiers"
def month_folder(date):
    try:
        dt=datetime.fromisoformat(str(date).replace("Z","+00:00"))
        return str(dt.year), f"{dt.month:02d}_{['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'][dt.month-1]}"
    except:return "Sans_date","Inconnu"
def clean_name(s):
    s=re.sub(r"[^A-Za-z0-9._ -]","_",str(s or "")).strip()
    return s[:80] or "Inconnu"
def organized_path(filename,date,source,sender="",conversation=""):
    y,m=month_folder(date); who=clean_name(conversation or sender or source)
    root=STORE/"classement"/classify(Path(filename))/y/m/who
    root.mkdir(parents=True,exist_ok=True)
    stem=clean_name(Path(filename).stem); ext=Path(filename).suffix
    return root/(hid(filename,date,source,sender,conversation)[:10]+"_"+stem+ext)
def add_file(path,source,account="",date="",sender="",subject="",conversation="",original_name=None):
    xs=load_files(); i=hid("file",source,account,str(path))
    if any(x["id"]==i for x in xs): return i
    xs.append({"id":i,"source":source,"account_email":account,"filename":original_name or path.name,
               "path":str(path),"date":date,"sender":sender,"subject":subject,"conversation":conversation})
    save_files(xs); return i
def add_link(source,url,text,date,sender,account_id="",account_email=""):
    xs=load_links(); k=hid(source,url,date,sender)
    if any(x.get("id")==k for x in xs): return
    xs.append({"id":k,"source":source,"url":url,"text":text,"date":date,"sender":sender,"account_id":account_id,"account_email":account_email}); save_links(xs)
def extract_links(text,source,date,sender,account_id="",account_email=""):
    for u in re.findall(r'https?://[^\s<>"\]\)]+',text or ""): add_link(source,u.rstrip(".,;:!?)]}>\"'"),text,date,sender,account_id,account_email)
def parse_wa(text,conv):
    xs=load_wa(); pat=re.compile(r"^\[?(\d{1,2}/\d{1,2}/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*-\s*([^:]+):\s?(.*)$"); cur=None
    def add(c):
        c={**c,"source":"WhatsApp","conversation":conv}; xs.append(c); extract_links(c["text"],"WhatsApp",c["date"],c["sender"])
    for line in text.splitlines():
        z=pat.match(line)
        if z:
            if cur:add(cur)
            d,t,s,b=z.groups(); cur={"date":d+" "+t,"sender":s,"text":b}
        elif cur: cur["text"]+="\n"+line
    if cur:add(cur)
    save_wa(xs)
def fetch_gmail(a,query="",limit=GMAIL_FETCH_LIMIT):
    s=service(a); cache={e["gmail_id"]:e for e in a.setdefault("emails",[])}
    res=s.users().messages().list(userId="me",q=query or None,maxResults=limit).execute(); new=0
    for ref in res.get("messages",[]):
        mid=ref["id"]
        if mid in cache: continue
        msg=s.users().messages().get(userId="me",id=mid,format="full").execute(); h=headers(msg["payload"]); texts=[]; atts=[]; walk(msg["payload"],texts,atts)
        try: date=datetime.fromtimestamp(int(msg.get("internalDate",0))/1000).isoformat()
        except: date=""
        text="\n".join(texts); e={"gmail_id":mid,"account_id":a["id"],"account_email":a["email"],"source":"Gmail","date":date,"sender":h.get("from",""),"subject":h.get("subject",""),"text":text}
        a["emails"].append(e); cache[mid]=e; new+=1; extract_links(text,"Gmail",date,h.get("from",""),a["id"],a["email"])
        for fn,mime,aid in atts:
            try:
                raw=s.users().messages().attachments().get(userId="me",messageId=mid,id=aid).execute()
                data=base64.urlsafe_b64decode(raw["data"].encode()+b"==="); p=organized_path(fn,date,"Gmail",h.get("from",""))
                p.write_bytes(data); add_file(p,"Gmail",a["email"],date,h.get("from",""),h.get("subject",""),original_name=fn)
            except: pass
    if new: a["last_sync"]=datetime.now().isoformat(timespec="seconds"); persist(a)
    return new

app=FastAPI(title="Recall "+VERSION)

@app.get("/",response_class=HTMLResponse)
def home(): return HTMLResponse((BASE/"templates"/"index.html").read_text(encoding="utf-8"))
@app.get("/version")
def version(): return {"version":VERSION,"fichier":str(Path(__file__).resolve())}
@app.get("/auth/gmail/add")
def gmail_add():
    if not CRED.exists(): return HTMLResponse("<h2>credentials.json manquant</h2>",500)
    f=new_flow(); url,state=f.authorization_url(access_type="offline",prompt="consent"); FLOWS[state]=f; return RedirectResponse(url)
@app.get("/auth/gmail/callback")
def gmail_callback(request:Request):
    state=request.query_params.get("state",""); f=FLOWS.pop(state,None) or new_flow(state)
    try:
        f.fetch_token(authorization_response=str(request.url)); c=f.credentials
        temp=Credentials.from_authorized_user_info(json.loads(c.to_json()),SCOPES)
        email=build("gmail","v1",credentials=temp).users().getProfile(userId="me").execute()["emailAddress"]
    except Exception as e:return HTMLResponse(f"<h2>Connexion Gmail échouée</h2><pre>{e}</pre>",500)
    xs=load_accounts(); old=next((a for a in xs if a["email"].lower()==email.lower()),None)
    if old: old["credentials"]=json.loads(c.to_json())
    else: xs.append({"id":hid("gmail",email,datetime.now().isoformat()),"email":email,"credentials":json.loads(c.to_json()),"emails":[],"last_sync":""})
    save_accounts(xs); return RedirectResponse("/")
@app.get("/api/gmail/accounts")
def gmail_accounts(): return {"accounts":[{"id":a["id"],"email":a["email"],"last_sync":a.get("last_sync",""),"cached":len(a.get("emails",[]))} for a in load_accounts()]}
@app.post("/api/gmail/sync/{account_id}")
def gmail_sync(account_id:str,q:str="",limit:int=100):
    a=next((x for x in load_accounts() if x["id"]==account_id),None)
    if not a:return {"ok":False,"error":"Compte introuvable"}
    try:return {"ok":True,"added":fetch_gmail(a,q,min(limit,200))}
    except Exception as e:return {"ok":False,"error":str(e)}
@app.post("/api/import")
async def import_whatsapp(file:UploadFile=File(...)):
    d=STORE/"imports"/hid(file.filename,datetime.now().isoformat())[:12]; d.mkdir(parents=True,exist_ok=True); p=d/Path(file.filename).name
    with p.open("wb") as f: shutil.copyfileobj(file.file,f)
    if zipfile.is_zipfile(p):
        out=d/"export"; out.mkdir()
        with zipfile.ZipFile(p) as z:z.extractall(out)
        for t in out.rglob("*.txt"):parse_wa(t.read_text(encoding="utf-8-sig",errors="ignore"),p.stem)
        for x in out.rglob("*"):
            if x.is_file() and x.suffix.lower() not in (".txt",".json",".html"):
                q=organized_path(x.name,"","WhatsApp",conversation=p.stem); shutil.copy2(x,q); add_file(q,"WhatsApp",conversation=p.stem,original_name=x.name)
    return {"ok":True}
@app.get("/api/search")
def search(q:str="",source:str="",kind:str="",live:bool=True):
    raw=q.strip(); toks=re.findall(r"[a-z0-9_-]{2,}",norm(raw)); pdf="pdf" in toks; fathom=("fathom" in toks or "fatom" in toks); rest=[t for t in toks if t not in ("pdf","fathom","fatom")]
    if live and raw and source.lower()!="whatsapp":
        gq=("has:attachment filename:pdf " if pdf else "fathom " if fathom else "")+" ".join(rest if (pdf or fathom) else [raw])
        for a in load_accounts():
            try:fetch_gmail(a,gq)
            except:pass
    pool=[]
    for a in load_accounts():
        pool += [{**e,"kind":"mail"} for e in a.get("emails",[])]
    pool += [{**x,"kind":"message"} for x in load_wa()]
    pool += [{**x,"kind":"lien"} for x in load_links()]
    pool += [{**x,"kind":"fichier","file_id":x["id"]} for x in load_files() if Path(x["path"]).exists()]
    if pdf: pool=[x for x in pool if x["kind"]=="fichier" and x.get("filename","").lower().endswith(".pdf")]
    if fathom: pool=[x for x in pool if "fathom" in norm(x.get("url",""))]
    if source: pool=[x for x in pool if norm(x.get("source",""))==norm(source)]
    if kind: pool=[x for x in pool if x.get("kind")==kind]
    keys=("subject","text","sender","url","filename","conversation","account_email")
    out=[x for x in pool if all(t in norm(" ".join(str(x.get(k,"")) for k in keys)) for t in rest)]
    out.sort(key=lambda x:x.get("date",""),reverse=True)
    return {"count":len(out),"results":out[:400]}
@app.get("/api/file/{file_id}")
def get_file(file_id:str,download:bool=False):
    x=next((z for z in load_files() if z["id"]==file_id),None)
    if not x or not Path(x["path"]).exists():raise HTTPException(404,"Fichier introuvable")
    return FileResponse(x["path"],filename=x["filename"],media_type=mimetypes.guess_type(x["path"])[0] or "application/octet-stream",content_disposition_type="attachment" if download else "inline")
