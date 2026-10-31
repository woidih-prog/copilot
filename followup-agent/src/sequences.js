/* LES SÉQUENCES DE RELANCE — version de départ.

   C'est le seul fichier à toucher pour changer le rythme et les angles.
   Le contenu exact des relances (ton, longueur, prétextes) se règle dans
   src/llm.js → ANGLES. On le travaillera ensemble à l'étape suivante.

   apres  : jours après le message précédent (pour l'étape 0 : après la date
            prévue dans le tracker).
   angle  : l'intention du message, que l'IA transforme en texte.
   fin    : ce qui se passe quand la séquence est épuisée sans réponse.      */

export const SEQUENCES = {
  /* Contact vivant, chaud ou tiède, décision attendue sous 3 semaines. */
  court: {
    etapes: [
      { apres: 0, angle: "pretexte" },        // le prétexte noté pendant le call
      { apres: 2, angle: "valeur" },          // un apport concret lié à son problème
      { apres: 3, angle: "question_simple" }, // une question à laquelle on répond en un mot
      { apres: 5, angle: "porte_ouverte" },   // on rend la main, sans pression
    ],
    fin: "long", // pas de réponse → il bascule en relance longue
  },

  /* « Pas le moment », froid, ou échéance lointaine : on entretient. */
  long: {
    etapes: [
      { apres: 0, angle: "nouvelle" },
      { apres: 21, angle: "valeur" },
      { apres: 45, angle: "check_in" },
      { apres: 90, angle: "porte_ouverte" },
    ],
    fin: "termine",
  },

  /* R2 calé : on protège le rendez-vous, on ne vend pas. */
  rappel_r2: {
    // heures AVANT le rendez-vous
    rappels: [
      { avantHeures: 24, angle: "rappel_veille" },
      { avantHeures: 2, angle: "rappel_jour" },
    ],
    fin: "termine",
  },
};

/* Délai de démarrage quand le tracker ne donne pas de date. */
export const DEMARRAGE_PAR_DEFAUT = { court: 3, long: 30, apres_mort: 45 };
