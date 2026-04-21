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
const { protect, authorize } = require('../../middlewares/auth'); 


router.use(protect, authorize('admin'));



//  Récupérer les demandes par statut
router.get('/admin/demandes-demo/statut/:statut', listerDemandesParStatut);

//  Obtenir les statistiques
router.get('/admin/demandes-demo/statistiques', obtenirStatistiques);

//  Contacter une demande (envoyer email avec 5 vidéos aléatoires)
router.patch('/:id/contacter', contacterDemande);

//  Clôturer une demande
router.patch('/admin/demandes-demo/:id/cloturer', cloturerDemande);



//  Lister tous les échantillons
router.get('/admin/echantillons-video', listerEchantillons);

//  Ajouter un échantillon
router.post('/admin/echantillons-video', ajouterEchantillon);

// Modifier un échantillon
router.patch('/admin/echantillons-video/:id', modifierEchantillon);

//  Supprimer un échantillon
router.delete('/admin/echantillons-video/:id', supprimerEchantillon);

//  Activer/Désactiver un échantillon
router.patch('/admin/echantillons-video/:id/toggle', toggleActiverEchantillon);

module.exports = router;