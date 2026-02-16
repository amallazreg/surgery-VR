const express = require('express');
const router = express.Router();
const {
  listerToutesDemandes,
  listerDemandesParStatut,
  obtenirStatistiques,
  contacterDemande,
  cloturerDemande,
  listerEchantillons,
  ajouterEchantillon,
  modifierEchantillon,
  supprimerEchantillon,
  toggleActiverEchantillon
} = require('../../controllers/admin/Demandesdemo');


// ===============================
// ROUTES DEMANDES DE DÉMO
// ===============================


// GET - Récupérer les demandes par statut
router.get('/admin/demandes-demo/statut/:statut', listerDemandesParStatut);

// GET - Obtenir les statistiques
router.get('/admin/demandes-demo/statistiques', obtenirStatistiques);

// PATCH - Contacter une demande (envoyer email avec 5 vidéos aléatoires)
router.patch('/:id/contacter', contacterDemande);

// PATCH - Clôturer une demande
router.patch('/admin/demandes-demo/:id/cloturer', cloturerDemande);

// ===============================
// ROUTES ÉCHANTILLONS VIDÉO
// ===============================

// GET - Lister tous les échantillons
router.get('/admin/echantillons-video', listerEchantillons);

// POST - Ajouter un échantillon
router.post('/admin/echantillons-video', ajouterEchantillon);

// PATCH - Modifier un échantillon
router.patch('/admin/echantillons-video/:id', modifierEchantillon);

// DELETE - Supprimer un échantillon
router.delete('/admin/echantillons-video/:id', supprimerEchantillon);

// PATCH - Activer/Désactiver un échantillon
router.patch('/admin/echantillons-video/:id/toggle', toggleActiverEchantillon);

module.exports = router;