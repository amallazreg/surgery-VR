
const TARIFS = {
  // Licences par utilisateur (prix mensuel)
  licence: {
    base: 50, // 50€/utilisateur/mois
    volume: {
      '1-10': 50,
      '11-50': 45,
      '51-100': 40,
      '101-200': 35,
      '200+': 30
    }
  },

  // Casques VR
  casquesVR: {
    'Meta Quest 3': 550,
    'Meta Quest Pro': 1100,
    'HTC Vive Pro 2': 1400,
    'Pico 4': 450,
    'Autre': 600
  },

  // Type de déploiement
  deploiement: {
    'Cloud': 0, // Inclus dans licence
    'On-premise': 5000, // Installation serveur
    'Hybride': 3000
  },

  // Formation (par utilisateur)
  formation: {
    base: 100,
    volume: {
      '1-10': 100,
      '11-50': 80,
      '51-100': 60,
      '101-200': 50,
      '200+': 40
    }
  },

  // Support annuel (pourcentage du total)
  support: {
    'Standard': 0.10, // 10%
    'Premium': 0.20,  // 20%
    'Enterprise': 0.30 // 30%
  },

  // TVA
  tva: {
    'France': 20,
    'Tunisie': 19,
    'Maroc': 20,
    'Autre': 20
  }
};

/**
 * Remises selon volume
 */
const REMISES = {
  '1-10': 0,      // Pas de remise
  '11-50': 5,     // 5%
  '51-100': 10,   // 10%
  '101-200': 15,  // 15%
  '200+': 20      // 20%
};

/**
 * Obtenir la tranche de volume
 */
const getTranche = (nombre) => {
  const n = parseInt(nombre);
  if (n <= 10) return '1-10';
  if (n <= 50) return '11-50';
  if (n <= 100) return '51-100';
  if (n <= 200) return '101-200';
  return '200+';
};

/**
 * Calculer le coût des licences
 */
const calculerCoutLicences = (nombreUtilisateurs, dureeEngagement = 12) => {
  const nombre = parseInt(nombreUtilisateurs);
  const tranche = getTranche(nombre);
  const prixUnitaire = TARIFS.licence.volume[tranche];
  
  // Coût mensuel * nombre d'utilisateurs * durée engagement (12 mois)
  return prixUnitaire * nombre * dureeEngagement;
};

/**
 * Calculer le coût des casques VR
 */
const calculerCoutCasquesVR = (nombreCasques, typeCasque = 'Meta Quest 3') => {
  const nombre = parseInt(nombreCasques);
  const prixUnitaire = TARIFS.casquesVR[typeCasque] || TARIFS.casquesVR['Autre'];
  
  return prixUnitaire * nombre;
};

/**
 * Calculer le coût de déploiement
 */
const calculerCoutDeploiement = (typeDeploiement) => {
  return TARIFS.deploiement[typeDeploiement] || 0;
};

/**
 * Calculer le coût de formation
 */
const calculerCoutFormation = (nombreUtilisateurs) => {
  const nombre = parseInt(nombreUtilisateurs);
  const tranche = getTranche(nombre);
  const prixUnitaire = TARIFS.formation.volume[tranche];
  
  return prixUnitaire * nombre;
};

/**
 * Calculer le coût du support annuel
 */
const calculerCoutSupport = (sousTotal, niveauSupport = 'Standard') => {
  const pourcentage = TARIFS.support[niveauSupport] || TARIFS.support['Standard'];
  return sousTotal * pourcentage;
};

/**
 * Calculer la remise selon le volume
 */
const calculerRemise = (nombreUtilisateurs, sousTotal) => {
  const tranche = getTranche(nombreUtilisateurs);
  const pourcentageRemise = REMISES[tranche];
  const montantRemise = sousTotal * (pourcentageRemise / 100);
  
  return {
    pourcentage: pourcentageRemise,
    montant: montantRemise
  };
};

/**
 * Calculer TVA selon le pays
 */
const calculerTVA = (montantHT, pays) => {
  const tauxTVA = TARIFS.tva[pays] || TARIFS.tva['Autre'];
  const montantTVA = montantHT * (tauxTVA / 100);
  
  return {
    taux: tauxTVA,
    montant: montantTVA
  };
};

/**
 * FONCTION PRINCIPALE DE CALCUL DE DEVIS
 */
const calculerDevis = (demande) => {
  try {
    // 1. Extraire les données
    const {
      nombreUtilisateurs,
      nombreCasquesVR,
      typeDeploiement,
      pays,
      besoins
    } = demande;

    // 2. Calculer les coûts individuels
    const coutLicences = calculerCoutLicences(nombreUtilisateurs);
    const coutCasquesVR = calculerCoutCasquesVR(nombreCasquesVR);
    const coutDeploiement = calculerCoutDeploiement(typeDeploiement);
    const coutFormation = calculerCoutFormation(nombreUtilisateurs);

    // 3. Calculer le sous-total (sans support)
    const sousTotalSansSupport = coutLicences + coutCasquesVR + coutDeploiement + coutFormation;

    // 4. Ajouter le support (10% du sous-total)
    const coutSupport = calculerCoutSupport(sousTotalSansSupport, 'Standard');
    const sousTotal = sousTotalSansSupport + coutSupport;

    // 5. Appliquer la remise
    const remise = calculerRemise(nombreUtilisateurs, sousTotal);
    const totalHT = sousTotal - remise.montant;

    // 6. Calculer la TVA
    const tva = calculerTVA(totalHT, pays);
    const totalTTC = totalHT + tva.montant;

    // 7. Retourner le devis détaillé
    return {
      coutLicences: Math.round(coutLicences * 100) / 100,
      coutCasquesVR: Math.round(coutCasquesVR * 100) / 100,
      coutDeploiement: Math.round(coutDeploiement * 100) / 100,
      coutFormation: Math.round(coutFormation * 100) / 100,
      coutSupport: Math.round(coutSupport * 100) / 100,
      
      sousTotal: Math.round(sousTotal * 100) / 100,
      remisePourcentage: remise.pourcentage,
      montantRemise: Math.round(remise.montant * 100) / 100,
      
      totalHT: Math.round(totalHT * 100) / 100,
      tauxTVA: tva.taux,
      montantTVA: Math.round(tva.montant * 100) / 100,
      totalTTC: Math.round(totalTTC * 100) / 100,
      
      dateCalcul: new Date(),
      formuleUtilisee: 'v1.0',
      parametresCalcul: {
        nombreUtilisateurs,
        nombreCasquesVR,
        typeDeploiement,
        pays,
        tranche: getTranche(nombreUtilisateurs),
        dureeEngagement: 12
      }
    };
  } catch (error) {
    console.error('Erreur calcul devis:', error);
    throw new Error('Erreur lors du calcul du devis');
  }
};

/**
 * Générer un récapitulatif textuel du devis
 */
const genererRecapitulatifDevis = (devis) => {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                DEVIS DÉTAILLÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 DÉTAIL DES COÛTS :

  Licences utilisateurs (${devis.parametresCalcul.nombreUtilisateurs} x 12 mois)
  ${devis.coutLicences.toFixed(2)} €

  Casques VR (${devis.parametresCalcul.nombreCasquesVR} unités)
  ${devis.coutCasquesVR.toFixed(2)} €

  Déploiement (${devis.parametresCalcul.typeDeploiement})
  ${devis.coutDeploiement.toFixed(2)} €

  Formation utilisateurs
  ${devis.coutFormation.toFixed(2)} €

  Support annuel (Standard)
  ${devis.coutSupport.toFixed(2)} €

                                ─────────────
  Sous-total                    ${devis.sousTotal.toFixed(2)} €

${devis.remisePourcentage > 0 ? `
  🎉 REMISE VOLUME (${devis.remisePourcentage}%)
  - ${devis.montantRemise.toFixed(2)} €
` : ''}

                                ─────────────
  TOTAL HT                      ${devis.totalHT.toFixed(2)} €
  
  TVA (${devis.tauxTVA}%)                       ${devis.montantTVA.toFixed(2)} €

                                ═════════════
  TOTAL TTC                     ${devis.totalTTC.toFixed(2)} €
                                ═════════════

📅 Valable 30 jours
🔒 Devis non contractuel
  `;
};

module.exports = {
  calculerDevis,
  genererRecapitulatifDevis,
  TARIFS,
  REMISES
};