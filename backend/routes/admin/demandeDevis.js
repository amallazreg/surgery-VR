const express = require('express');
const router = express.Router();
const {
  listerToutesDemandesDevis,
  listerDemandesParStatut,
  obtenirStatistiques,
  calculerDevisEstime,
  envoyerDevis,
  calculerEtEnvoyerDevis,
  mettreAJourNotes,
  supprimerDemande
} = require('../../controllers/admin/demandeDevis');




// GET - Récupérer toutes les demandes
router.get('/demandes-devis', listerToutesDemandesDevis);

// GET - Récupérer les demandes par statut
router.get('/demandes-devis/statut/:statut', listerDemandesParStatut);

// GET - Obtenir les statistiques
router.get('/demandes-devis/statistiques', obtenirStatistiques);

// POST - Calculer le devis (sans l'envoyer)
router.post('/demandes-devis/:id/calculer', calculerDevisEstime);

// POST - Envoyer le devis (après calcul)
router.post('/demandes-devis/:id/envoyer', envoyerDevis);

// POST - Calculer ET envoyer le devis (action combinée)
router.post('/demandes-devis/:id/calculer-et-envoyer', calculerEtEnvoyerDevis);

// PATCH - Mettre à jour les notes admin
router.patch('/demandes-devis/:id/notes', mettreAJourNotes);

// DELETE - Supprimer une demande
router.delete('/demandes-devis/:id', supprimerDemande);

module.exports = router;