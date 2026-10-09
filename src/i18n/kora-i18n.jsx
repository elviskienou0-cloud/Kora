import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { Globe2, Languages } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getLanguageStorageKey, isSupportedLanguage, normalizeLanguage, readStoredLanguage } from "@/i18n/language-preferences.js"

const STORAGE_KEY = "kora-language"
const THEME_STORAGE_KEY = "kora-theme"
const THEME_EXPLICIT_STORAGE_KEY = "kora-theme-explicit"
const DEFAULT_THEME = "light"

export const SUPPORTED_LANGUAGES = {
  fr: { code: "fr", label: "Français", flag: "🇫🇷", htmlLang: "fr", locale: "fr_FR" },
  en: { code: "en", label: "English", flag: "🇬🇧", htmlLang: "en", locale: "en_GB" },
}

const fr = {
  common: {
    appName: "KORA", language: "Langue", french: "Français", english: "English",
    loading: "Chargement…", saving: "Enregistrement...", saved: "Enregistré", save: "Enregistrer",
    cancel: "Annuler", close: "Fermer", clear: "Effacer", apply: "Appliquer", confirm: "Confirmer",
    delete: "Supprimer", edit: "Modifier", create: "Créer", update: "Mettre à jour", back: "Retour",
    next: "Suivant", previous: "Précédent", search: "Rechercher", filter: "Filtrer", sort: "Trier",
    reset: "Réinitialiser", refresh: "Actualiser", submit: "Envoyer", send: "Envoyer", view: "Voir",
    details: "Détails", more: "Plus", less: "Moins", optional: "Optionnel", required: "Obligatoire",
    retry: "Veuillez réessayer.", success: "Succès", error: "Erreur", warning: "Attention",
    information: "Information", active: "Actif", inactive: "Inactif", available: "Disponible",
    unavailable: "Indisponible", public: "Public", private: "Privé", verified: "Vérifié",
    unverified: "Non vérifié", online: "En ligne", offline: "Hors connexion", today: "Aujourd'hui",
    yesterday: "Hier", now: "À l'instant", unknown: "Inconnu", notProvided: "Non renseigné",
    noResults: "Aucun résultat", noData: "Aucune donnée", requiredFields: "Veuillez remplir les champs obligatoires.",
    copyLink: "Copier le lien", copied: "Copié ✅", share: "Partager", contact: "Contacter",
    invite: "Inviter", all: "Tous", clientKora: "Client KORA", noDescription: "Aucune description.", and: "et", sendInvitation: "Envoyer l'invitation",
  },

  navigation: {
    home: "Accueil", discover: "Découvrir", favorites: "Mes favoris", projects: "Mes projets",
    requests: "Mes demandes", messages: "Messages", notifications: "Notifications", dashboard: "Tableau de bord",
    talents: "Mes talents", subscription: "Abonnement", settings: "Paramètres", admin: "Administration",
    users: "Utilisateurs", clients: "Clients", managers: "Managers", moderation: "Modération",
    payments: "Paiements", subscriptions: "Abonnements", logs: "Journaux", reports: "Signalements",
  },

  account: {
    account: "Compte", client: "Client", manager: "Manager", talent: "Talent", admin: "Administrateur",
    profile: "Mon profil", logout: "Déconnexion", login: "Connexion", register: "Créer un compte",
    forgotPassword: "Mot de passe oublié ?", resetPassword: "Réinitialiser le mot de passe",
    email: "Email", password: "Mot de passe", confirmPassword: "Confirmer le mot de passe", name: "Nom complet",
  },

  premium: {
    title: "Passer Premium", description: "Débloquez toutes les fonctionnalités", button: "Mettre à jour",
    upgrade: "Passer à Premium", plans: "Voir les abonnements",
  },

  seo: {
    siteTitle: "KORA — Plateforme des talents africains",
    siteDescription: "Découvrez, contactez et collaborez avec les talents africains sur KORA.",
    homeTitle: "KORA — Découvrez les talents africains",
    homeDescription: "Trouvez des talents africains correspondant à vos besoins et développez vos collaborations avec KORA.",
    categoriesTitle: "Catégories de talents africains | KORA",
    categoriesDescription: "Explorez les catégories et découvrez les talents africains disponibles sur KORA.",
    browseTitle: "Découvrir les talents | KORA",
    browseDescription: "Recherchez et découvrez des talents africains selon leurs compétences, catégories, pays et disponibilités.",
    talentSuffix: "Talent",
    talentFallbackTitle: "Professionnel africain",
    talentFallbackDescription: "Découvrez ce talent professionnel sur KORA.",
    projectsTitle: "Mes projets | KORA",
    messagesTitle: "Messages | KORA",
    settingsTitle: "Paramètres | KORA",
  },

  landing: {
    badge: "La plateforme des talents africains",
    titlePart1: "Les meilleurs talents africains,", titlePart2: "au même endroit.",
    description: "Découvrez des talents exceptionnels, échangez directement avec leurs managers et donnez vie à vos projets.",
    discoverTalents: "Découvrir les talents", createAccount: "Créer un compte", getStarted: "Commencer", learnMore: "En savoir plus",
    whyKora: "Pourquoi KORA?", trustedTalents: "Des profils publiés",
    trustedTalentsDescription: "Découvrez les profils publiés sur KORA avec leurs compétences et réalisations renseignées.",
    directContact: "Contact direct", directContactDescription: "Échangez directement avec les managers et avancez rapidement sur vos projets.",
    securePayments: "Paiement d’abonnement", securePaymentsDescription: "Les abonnements Manager sont actuellement payés via SasPay.",
    howItWorks: "Comment ça marche ?", step1Title: "Trouvez votre talent",
    step1Description: "Recherchez selon vos besoins, votre budget, votre pays ou les compétences recherchées.",
    step2Title: "Contactez ou invitez", step2Description: "Contactez le manager ou invitez le talent sur un projet existant.",
    step3Title: "Collaborez", step3Description: "Organisez votre collaboration et faites avancer votre projet.",
    featuredTalents: "Talents à découvrir", featuredDescription: "Quelques profils disponibles sur KORA.",
    viewAllTalents: "Voir tous les talents", testimonials: "Ils parlent de KORA", faq: "Questions fréquentes",
    finalCtaTitle: "Votre prochain talent est peut-être déjà sur KORA.",
    finalCtaDescription: "Créez votre compte et commencez à découvrir les talents africains.",
  },

  categories: {
    title: "Découvrez les talents par catégorie", description: "Explorez les différentes catégories de talents disponibles sur KORA.",
    all: "Toutes les catégories", seeTalents: "Voir les talents", featured: "Talents disponibles",
  },

  talents: {
    talent: "Talent", talents: "Talents", title: "Talents", myTalents: "Mes talents", addTalent: "Ajouter un talent",
    createTalent: "Créer un profil talent", editTalent: "Modifier le talent", deleteTalent: "Supprimer le talent",
    publishTalent: "Publier le talent", unpublishTalent: "Dépublier le talent", publish: "Publier", pending: "En attente",
    published: "Publié", draft: "Brouillon", rejected: "Refusé", suspended: "Suspendu", verified: "Vérifié",
    available: "Disponible", unavailable: "Indisponible", searchPlaceholder: "Rechercher un talent, une compétence, une ville...",
    noTalents: "Aucun talent trouvé.", firstName: "Prénom", lastName: "Nom", fullName: "Nom complet",
    titleLabel: "Titre professionnel", category: "Catégorie", country: "Pays", city: "Ville", location: "Localisation",
    bio: "Description / Bio", skills: "Compétences", rate: "Tarif", dailyRate: "Tarif journalier", currency: "Devise",
    portfolio: "Portfolio", photos: "Photos", videos: "Vidéos", links: "Liens", manager: "Manager", rating: "Note",
    reviews: "Avis", completedProjects: "Projets réalisés", availability: "Disponibilité", newMission: "Accepte de nouvelles missions",
    viewProfile: "Voir le profil", contact: "Contacter", invite: "Inviter à un projet", share: "Partager le profil",
    verifiedKora: "Vérifié KORA", noSkills: "Aucune compétence renseignée.", noPortfolio: "Aucun élément de portfolio pour le moment.",
  },

  talent: {
    profile: "Profil Talent", profileOf: "Profil de", about: "À propos", skills: "Compétences", availability: "Disponibilité",
    dailyRate: "Tarif journalier", rating: "Note", reviews: "Avis", projects: "Projets", portfolio: "Portfolio", manager: "Manager",
    managerDescription: "Responsable de ce talent.", verifiedKora: "Vérifié KORA", available: "Disponible", unavailable: "Indisponible",
    acceptsMissions: "Le talent accepte de nouvelles missions.", noLongerAccepting: "Le talent n'accepte pas de nouvelles missions pour le moment.",
    noDescription: "Aucune présentation renseignée.", locationMissing: "Localisation non renseignée.", categoryMissing: "Catégorie non renseignée.",
    noManager: "Informations du manager indisponibles.", inviteTitle: "Inviter à un projet",
    inviteDescription: "Sélectionnez un de vos projets actifs.", selectProject: "Sélectionnez un projet…",
    noProject: "Aucun projet disponible. Créez d'abord un projet depuis votre espace Client.", invitationMessage: "Message d'invitation (optionnel)",
    invitationSent: "Invitation envoyée ✅", invitationDescription: "La demande a été envoyée au manager du talent.", contactManager: "Contacter le manager",
    openingConversation: "Ouverture…", projectNotFound: "Projet introuvable.", talentUnavailable: "Talent indisponible",
    notPublished: "Ce profil n’est pas encore publié publiquement. Seul le manager propriétaire ou un administrateur peut actuellement le consulter.",
    portfolioExternalLink: "Lien externe", portfolioVideo: "Vidéo", portfolioImage: "Image", portfolioDocument: "Document",
    shareProfile: "Partager ce profil", shareDevice: "Partager avec l'appareil", whatsapp: "WhatsApp", facebook: "Facebook", x: "X",
    copied: "Lien du profil copié ✅", managerUnavailable: "Le manager de ce talent n'est pas disponible.",
    loginToFavorite: "Connectez-vous pour enregistrer ce talent dans vos favoris.",
    loginToContact: "Connectez-vous pour contacter ce talent.",
    loginToInvite: "Connectez-vous pour inviter ce talent.",
    ownTalent: "Ce talent est géré par votre propre compte.",
    conversationNotFound: "Conversation introuvable.",
    favoriteError: "Impossible de modifier vos favoris.",
    shareError: "Impossible de partager ce profil.",
    copyError: "Impossible de copier le lien.",
    contactError: "Impossible d'ouvrir la conversation.",
    inviteError: "Impossible d'envoyer l'invitation.",
    loadProjectsError: "Impossible de charger vos projets.",
    sendInvitation: "Envoyer l'invitation",
  },

  browse: {
    title: "Découvrir les talents", description: "Trouvez le talent adapté à votre projet.", search: "Rechercher un talent...", category: "Catégorie",
    country: "Pays", availability: "Disponibilité", availableOnly: "Disponibles uniquement", verifiedOnly: "Profils vérifiés uniquement",
    price: "Tarif journalier", minPrice: "Tarif minimum", maxPrice: "Tarif maximum", sortBy: "Trier par", relevance: "Pertinence",
    newest: "Plus récents", rating: "Mieux notés", priceLow: "Tarif croissant", priceHigh: "Tarif décroissant",
    resetFilters: "Réinitialiser les filtres", applyFilters: "Appliquer les filtres", results: "résultats", result: "résultat",
    previous: "Précédent", next: "Suivant", noResults: "Aucun talent ne correspond à vos critères.",
  },

  favorites: {
    title: "Mes favoris", description: "Retrouvez les talents que vous avez enregistrés.", empty: "Vous n'avez encore aucun favori.",
    discover: "Découvrir les talents", remove: "Retirer des favoris", add: "Ajouter aux favoris",
  },

  projects: {
    title: "Mes projets", description: "Créez et gérez vos projets.", create: "Créer un projet", new: "Nouveau projet", edit: "Modifier le projet",
    detail: "Détails du projet", titleLabel: "Titre du projet", descriptionLabel: "Description", budget: "Budget", budgetMin: "Budget minimum",
    budgetMax: "Budget maximum", currency: "Devise", dueDate: "Date d'échéance", status: "Statut", draft: "Brouillon", open: "Ouvert",
    pending: "En attente", active: "Actif", completed: "Terminé", cancelled: "Annulé", save: "Enregistrer le projet",
    update: "Mettre à jour le projet", delete: "Supprimer le projet", cancel: "Annuler le projet", noProjects: "Aucun projet.",
    projectCreated: "Projet créé ✅", projectUpdated: "Projet mis à jour ✅", projectDeleted: "Projet supprimé ✅",
    confirmDelete: "Voulez-vous vraiment supprimer ce projet ?",
  },

  requests: {
    title: "Mes demandes", description: "Suivez vos demandes et invitations.", request: "Demande", requests: "Demandes", pending: "En attente",
    accepted: "Acceptée", rejected: "Refusée", cancelled: "Annulée", sent: "Envoyée", received: "Reçue", project: "Projet", talent: "Talent",
    manager: "Manager", client: "Client", budget: "Budget", details: "Détails de la demande", accept: "Accepter", reject: "Refuser",
    view: "Voir la demande", invitation: "Invitation", invitationSent: "Invitation envoyée", noRequests: "Aucune demande.",
    noRequestsDescription: "Vous n'avez actuellement aucune demande.",
  },

  requestForm: {
    badge: "Demande de collaboration",
    title: "Décrire votre projet",
    forTalent: "Pour {talent}",
    openButton: "Envoyer une demande",
    projectTitle: "Titre du projet",
    projectTitlePlaceholder: "Ex. Campagne publicitaire Coca-Cola",
    projectType: "Type de projet",
    selectType: "Sélectionnez un type…",
    description: "Description",
    descriptionPlaceholder: "Décrivez ce que vous souhaitez réaliser avec ce talent…",
    dateStart: "Date / début de période",
    dateEnd: "Fin de période",
    budget: "Budget proposé (facultatif)",
    location: "Lieu",
    locationPlaceholder: "Ex. Ouagadougou, Burkina Faso",
    additionalInfo: "Informations complémentaires",
    additionalInfoPlaceholder: "Contraintes, livrables, horaires, références, etc.",
    notice: "La demande contient directement le contexte du projet. Le manager pourra l'examiner, vous répondre, accepter ou refuser la collaboration.",
    submit: "Envoyer la demande",
    titleRequired: "Le titre du projet est obligatoire.",
    descriptionRequired: "La description du projet est obligatoire.",
    dateInvalid: "La fin de période ne peut pas être avant le début.",
    sent: "Demande envoyée ✅",
    sentDescription: "Le manager du talent a reçu les informations du projet.",
    error: "Impossible d'envoyer la demande",
    types: { advertising: "Publicité", event: "Événement", musicVideo: "Clip", shooting: "Shooting", socialCampaign: "Campagne réseaux sociaux", fashion: "Mode", filmTv: "Film / TV", other: "Autre" },
  },

  messages: {
    title: "Messages", conversations: "Conversations", newConversation: "Nouvelle conversation", search: "Rechercher une conversation",
    placeholder: "Écrivez votre message...", send: "Envoyer", online: "En ligne", offline: "Hors connexion", realtime: "Temps réel",
    noConversations: "Aucune conversation.", noMessages: "Aucun message.", loading: "Chargement des messages…", opening: "Ouverture…",
    back: "Retour", unread: "non lu", unreadPlural: "non lus",
  },

  notifications: {
    title: "Notifications", description: "Retrouvez vos alertes et mises à jour.", markRead: "Marquer comme lu", markAllRead: "Tout marquer comme lu",
    all: "Toutes", unread: "Non lues", read: "Lues", noNotifications: "Aucune notification.", noUnread: "Aucune notification non lue.", descriptionEmpty: "Les notifications importantes apparaîtront ici.",
    invitation: "Nouvelle invitation", request: "Mise à jour d'une demande", message: "Nouveau message", payment: "Paiement", subscription: "Abonnement", security: "Sécurité",
  },

  clientUi: {
    dashboard: {
      loading: "Chargement de votre tableau de bord…", hello: "Bonjour, {name}",
      welcome: "Bienvenue sur votre tableau de bord KORA", search: "Rechercher",
      newRequest: "Nouvelle demande", requestsSent: "Demandes envoyées", requestsAccepted: "Demandes acceptées",
      favoriteTalents: "Talents favoris", spentBudget: "Budget dépensé", recentRequests: "Dernières demandes",
      recentRequestsDescription: "Vos demandes récentes auprès des managers", seeAll: "Tout voir",
      noRequests: "Aucune demande", noRequestsDescription: "Vous n'avez encore envoyé aucune demande.",
      exploreTalents: "Explorer les talents", recentTalents: "Talents récents",
      recentTalentsDescription: "Talents actuellement présents sur KORA",
      noTalents: "Aucun talent disponible", noPublicProfiles: "Aucun profil public n'est actuellement disponible.",
      viewAllTalents: "Voir tous les talents", activity: "Votre activité",
      activityDescription: "Les données apparaîtront ici à mesure que vous utilisez KORA.",
      searches: "Recherches", savedSearches: "Recherches de talents enregistrées",
      favorites: "Favoris", savedTalents: "Talents enregistrés", requests: "Demandes",
      noSentRequests: "Demandes envoyées", unknown: "Inconnu", talent: "Talent", you: "vous",
      latestActions: "Dernières actions", category: "Catégorie",
    },
    favorites: {
      title: "Mes favoris", savedCount: "{count} talent(s) enregistré(s)",
      searchPlaceholder: "Rechercher dans vos favoris…", loading: "Chargement",
      noFavorites: "Aucun favori pour le moment",
      noFavoritesDescription: "Enregistrez les talents qui vous intéressent pour les retrouver facilement et comparer leurs profils.",
      discover: "Découvrir des talents", howItWorks: "Comment ça marche ?",
      clickOn: "Cliquez sur", clickOnDescription: "l'icône cœur sur un profil",
      findThem: "Retrouvez-les", findThemDescription: "ici, à tout moment",
      sendRequests: "Envoyez des", sendRequestsDescription: "demandes en un clic",
      noResults: "Aucun résultat", noResultsDescription: "Aucun de vos favoris ne correspond à « {search} ».",
      managerUnavailable: "Le manager de ce talent est indisponible.",
      ownTalent: "Ce talent est géré par votre propre compte.",
      openConversation: "Ouverture…", contact: "Contacter", removeError: "Impossible de retirer ce favori.",
      loadingError: "Impossible de charger vos favoris pour le moment.", contactError: "Impossible d'ouvrir la conversation.",
    },
    notifications: {
      title: "Notifications", refresh: "Actualiser", markAllRead: "Tout marquer comme lu",
      markRead: "Marquer comme lu", loadError: "Impossible de charger les notifications.",
      markReadError: "Impossible de marquer la notification comme lue.",
      markAllError: "Impossible de marquer les notifications.", markedAllRead: "Notifications marquées comme lues.",
      none: "Aucune notification", noUnread: "Vous n'avez aucune notification non lue.",
      emptyDescription: "Les notifications importantes apparaîtront ici.",
      fallbackTitle: "Notification KORA", new: "Nouveau", page: "Page {page}", of: "sur {totalPages}",
      total: "{count} notification(s)", previous: "Précédente", next: "Suivante",
    },
    projects: {
      area: "Espace Client", title: "Mes projets", count: "{count} projet(s) enregistré(s)",
      refresh: "Actualiser", create: "Créer un projet", searchPlaceholder: "Rechercher un projet…",
      clearSearch: "Effacer la recherche", loadError: "Impossible de charger vos projets.",
      loading: "Chargement", noResults: "Aucun projet trouvé", none: "Aucun projet",
      searchNoMatch: "Aucun projet ne correspond à votre recherche.",
      createFirst: "Créez votre premier projet pour le retrouver ici et commencer à travailler avec les talents KORA.",
      budget: "Budget", dueDate: "Date limite", dueDateMissing: "Non définie", details: "Détail",
      cancel: "Annuler", cancelConfirm: "Annuler le projet « {title} » ?",
      cancelError: "Impossible d'annuler le projet.", cancelled: "Projet annulé.",
      undefinedBudget: "Budget non défini", page: "Page {page}", of: "sur {totalPages}",
      previous: "Précédent", next: "Suivant", titleLabel: "Titre du projet", descriptionLabel: "Description",
      minBudget: "Budget minimum", maxBudget: "Budget maximum", currency: "Devise",
      save: "Enregistrer le projet", saveChanges: "Enregistrer les modifications",
      newProject: "Nouveau projet", projectInfo: "Informations du projet", titlePlaceholder: "Ex. Refonte du site web KORA",
      descriptionPlaceholder: "Décrivez le contexte, les objectifs, les livrables et les attentes.",
      minBudgetInvalid: "Le budget minimum est invalide.", maxBudgetInvalid: "Le budget maximum est invalide.",
      budgetRangeInvalid: "Le budget minimum ne peut pas dépasser le maximum.",
      titleRequired: "Le titre du projet est obligatoire.", descriptionRequired: "La description du projet est obligatoire.",
      saveError: "Impossible d'enregistrer le projet.", created: "Projet enregistré ✅", updated: "Projet modifié ✅",
      status: "État", back: "Retour", rateProject: "Évaluation du projet",
      noEligibleTalents: "Aucun talent éligible n'est rattaché à ce projet.",
      messages: "Messages", cancelProject: "Annuler le projet", completed: "Terminé",
    },
    requests: {
      area: "Espace Client", title: "Mes demandes", count: "{count} demande(s)",
      refresh: "Actualiser", loadError: "Impossible de charger vos demandes.",
      none: "Aucune demande envoyée.", invitation: "Invitation", project: "Projet :",
      talent: "Talent :", viewTalent: "Voir le talent", previous: "Précédent", next: "Suivant",
      page: "Page {page}", of: "sur {totalPages}",
    },
    review: {
      unavailable: "Évaluation indisponible", backToProject: "Retour au projet",
      notComplete: "Le projet n'est pas encore terminé", noReviews: "Aucun avis à publier",
      allReviewed: "Tous les talents rattachés à ce projet ont déjà été évalués, ou aucun talent n'est actuellement éligible.",
      title: "Évaluer le projet", projectComplete: "Projet terminé — votre avis sera rattaché au projet et au talent choisi.",
      yourReview: "Votre évaluation", ratingCommentRequired: "Une note de 1 à 5 et un commentaire sont requis.",
      talent: "Talent évalué", rating: "Note", comment: "Commentaire",
      commentPlaceholder: "Partagez votre expérience avec ce talent…", cancel: "Annuler",
      submit: "Publier mon avis", loadError: "Impossible de préparer l'évaluation.",
      projectNotFound: "Projet introuvable ou inaccessible.", eligibleTalentMissing: "Aucun talent éligible à évaluer.",
      chooseRating: "Choisissez une note de 1 à 5.", commentRequired: "Ajoutez un commentaire.",
      saved: "Évaluation enregistrée ✅", saveError: "Impossible d'enregistrer l'avis.",
    },
  },

  dashboard: {
    title: "Tableau de bord", welcome: "Bienvenue sur KORA.", overview: "Vue d'ensemble", recentActivity: "Activité récente", statistics: "Statistiques",
    totalProjects: "Total des projets", activeProjects: "Projets actifs", completedProjects: "Projets terminés", pendingRequests: "Demandes en attente",
    talents: "Talents", messages: "Messages", notifications: "Notifications", unreadMessages: "Messages non lus", noActivity: "Aucune activité récente.",
  },

  home: {
    searchPlaceholder: "Rechercher un talent, un service...",
    welcomeBack: "Content de vous revoir, {name} !",
    welcomeUser: "Bienvenue, {name}",
    clientIntro: "Trouvez les talents africains adaptés à votre projet.",
    managerIntro: "Espace manager : gérez vos talents, suivez vos projets et vos collaborations.",
    adminIntro: "Espace administrateur : consultez les statistiques globales de la plateforme.",
    realtimeStats: "Statistiques clés en temps réel",
    koraSelection: "Sélection KORA",
    recommendedTalents: "Talents recommandés pour vous",
    recommendedDescription: "Sélectionnés selon votre activité et vos préférences",
    from: "À partir de",
    loadingRecommended: "Chargement des talents recommandés...",
    noPublishedTalents: "Aucun talent publié pour le moment.",
    latestActions: "Dernières actions",
    projectsCompleted: "projets",
  },

  manager: {
    dashboard: "Tableau de bord Manager", myTalents: "Mes talents", myRequests: "Demandes", subscription: "Abonnement",
    manageTalent: "Gérez vos talents et leur visibilité.", createTalent: "Créer un talent", pending: "En attente", published: "Publiés", total: "Total", averageRating: "Note moyenne",
    loading: "Chargement du tableau de bord...", errorLoad: "Impossible de charger les données du tableau de bord.", retry: "Réessayer",
    manageTalents: "Gérez vos talents et suivez vos demandes.", activeRequests: "Demandes actives", revenue: "Revenus", settledTransactions: "Transactions réglées",
    requestActivity: "Activité des demandes", requestsLast7Days: "Demandes reçues au cours des 7 derniers jours", quickManagement: "Gestion rapide",
    quickManagementDescription: "Accédez rapidement à vos talents.", editMyTalents: "Modifier mes talents", talentsManaged: "Les talents que vous gérez actuellement.",
    manageMyTalents: "Gérer mes talents", searchTalent: "Rechercher un talent...", noTalentFound: "Aucun talent trouvé", noTalent: "Aucun talent",
    noTalentMatch: "Aucun talent ne correspond à votre recherche.", addTalentHint: "Commencez par ajouter un talent à votre espace manager.",
    manageTalentLabel: "Gérer le talent", noNotifications: "Aucune notification", recentRequests: "Demandes récentes",
    recentRequestsDescription: "Les dernières demandes reçues par votre espace.", viewRequests: "Voir les demandes", noRequests: "Aucune demande pour le moment.",
    open: "Ouvrir", requestNumber: "Demande #{id}", undefinedStatus: "Statut non défini",    availabilityLabel: "Disponibilité", artistFee: "Cachet de l’artiste", showFeePublicly: "Afficher le cachet publiquement", profilePhoto: "Photo de profil", currentTalentPhoto: "Photo actuelle du talent", coverPhoto: "Photo de couverture", photosVideos: "Photos / vidéos", imageUploadHint: "1 image · JPG, PNG, WebP ou GIF · 5 Mo max.", coverUploadHint: "1 image · format paysage recommandé · 5 Mo max.", workflow: "Workflow Manager",
    clientContact: "Contacter le client", projectContext: "Contexte du projet", projectManagement: "Gestion du projet", markCompleted: "Marquer terminé", sendReply: "Envoyer la réponse", accept: "Accepter", reject: "Refuser", paymentRecorded: "Votre paiement a été enregistré. Un administrateur KORA doit le confirmer avant l’activation.", paymentHistory: "Historique des paiements", saspayPending: "Les paiements SasPay restent en attente jusqu'à leur validation par un administrateur autorisé.", choosePlan: "Choisissez votre formule. Les paiements d’abonnement Pro et Business sont validés manuellement par KORA.", retainedData: "Vos talents et historiques restent associés à votre compte.", projectManagementFeatures: "Gestion des demandes et projets", managerTools: "Outils manager KORA", saspayValidation: "Paiement SasPay + validation KORA", changeCover: "Changer la couverture", uploading: "Envoi…", cover: "Couverture", profile: "Profil",
    planFree1: "1 talent maximum", planProfilePortfolio: "Profil talent et portfolio", planFee: "Gestion du cachet", planRequests: "Gestion des demandes", planMessaging: "Messagerie et notifications", planBasicTalent: "Gestion de base des talents", planTrial: "30 jours d'accès gratuit", planPro1: "3 talents maximum", planFreeFeatures: "Toutes les fonctions du plan Gratuit", planOperations: "Gestion opérationnelle des projets", planManagerProfile: "Profil manager", planBusiness1: "Talents illimités", planProFeatures: "Toutes les fonctions du plan Pro", planBusinessBadge: "Badge Business sur votre profil", planUnlimited: "Organisation sans limite de vos talents", activePlan: "Forfait actif", trialEnded: "Essai terminé", useFree: "Utiliser gratuitement", choosePlanButton: "Choisir {name}", noPaidSubscription: "Sans abonnement payant", monthlySubscription: "Abonnement mensuel", perMonth: "/ mois",
    replyPlaceholder: "Écrivez votre réponse au client…", createdWithRequest: "Créé avec la demande", alreadyProcessed: "Cette demande a déjà été traitée.", requestAccepted: "Demande acceptée.", requestRejected: "Demande refusée.", projectCompleted: "Projet marqué comme terminé.", projectStatusUpdated: "Statut du projet mis à jour.",
    expiredMulti: "Pour les managers qui gèrent plusieurs talents.", expiredThree: "Pour gérer jusqu’à 3 talents.", preparing: "Préparation...", resubscribe: "Réabonner",
  },

  admin: {
    title: "Administration", dashboard: "Tableau de bord", controlCenter: "Centre de contrôle KORA",
    dataSource: "Toutes les données affichées proviennent des tables Supabase disponibles.", users: "Utilisateurs", clients: "Clients", managers: "Managers",
    admins: "Administrateurs", talents: "Talents", publishedTalents: "Talents publiés", pendingTalents: "Talents en attente", projects: "Projets",
    requests: "Demandes", messages: "Messages", conversations: "Conversations", reports: "Signalements", moderation: "Modération", subscriptions: "Abonnements",
    payments: "Paiements", logs: "Journaux", settings: "Paramètres administration", suspendedUsers: "Utilisateurs suspendus", openProjects: "Projets ouverts",
    activeProjects: "Projets actifs", completedProjects: "Projets terminés", pendingRequests: "Demandes en attente", acceptedRequests: "Demandes acceptées",
    rejectedRequests: "Demandes refusées", pendingReports: "Signalements en attente", activeSubscriptions: "Abonnements actifs", expiredSubscriptions: "Abonnements expirés",
    pendingPayments: "Paiements en attente", paidPayments: "Paiements payés", failedPayments: "Paiements échoués", transactions: "Transactions", administration: "Administration",
  },

  moderation: {
    title: "Modération", reports: "Signalements", pending: "En attente", reviewed: "Examiné", resolved: "Résolu", dismissed: "Rejeté",
    suspend: "Suspendre", reactivate: "Réactiver", hide: "Masquer", publish: "Publier", reject: "Refuser", noReports: "Aucun signalement.",
  },

  payments: {
    title: "Paiements", payment: "Paiement", payments: "Paiements", pending: "En attente", paid: "Payé", failed: "Échoué", cancelled: "Annulé",
    provider: "Fournisseur", reference: "Référence", amount: "Montant", currency: "Devise", date: "Date", method: "Méthode", status: "Statut",
    orangeMoney: "Orange Money", moovMoney: "Moov Money", wave: "Wave", card: "Carte bancaire", visa: "Visa", mastercard: "Mastercard",
  },

  subscriptions: {
    title: "Abonnements", subscription: "Abonnement", trial: "Période d'essai", active: "Actif", expired: "Expiré", cancelled: "Annulé",
    pending: "En attente", plan: "Plan", startDate: "Début", endDate: "Fin", period: "Période", upgrade: "Mettre à niveau", renew: "Renouveler",
  },

  reviews: {
    title: "Avis", review: "Avis", reviews: "Avis", rating: "Note", comment: "Commentaire", submit: "Publier mon avis",
    noReviews: "Aucun avis pour le moment.", thankYou: "Merci pour votre avis.",
  },

  clientSettings: {
    tabs: { profile: "Mon profil", preferences: "Préférences", notifications: "Notifications", security: "Sécurité" },
    profile: {
      title: "Mon profil", description: "Informations personnelles de votre compte.",
      cover: "Couverture", changeCover: "Changer la couverture", uploadInProgress: "Envoi de l’image…",
      avatar: "Photo de profil", photoAndCover: "Photo de profil et couverture", fullName: "Nom complet",
      phone: "Téléphone", city: "Ville", company: "Entreprise", bio: "Biographie",
      personalData: "Gérer mes données personnelles →",
    },
    preferences: { title: "Préférences", description: "Langue et apparence de votre espace.", language: "Langue", theme: "Thème", light: "Clair", dark: "Sombre", auto: "Auto", save: "Enregistrer les préférences" },
    notifications: { title: "Notifications", description: "Choisissez les alertes que vous souhaitez recevoir.", email: "Notifications par email", browser: "Notifications du navigateur", marketing: "Offres et nouveautés KORA", save: "Enregistrer" },
    security: { title: "Sécurité", description: "Modifier votre mot de passe.", currentPassword: "Mot de passe actuel", newPassword: "Nouveau mot de passe", confirmPassword: "Confirmer", update: "Mettre à jour" },
    loading: "Chargement des paramètres…",
    errors: {
      load: "Impossible de charger vos paramètres.", upload: "Impossible d’envoyer l’image.",
      nameRequired: "Le nom est obligatoire.", profileSave: "Impossible d'enregistrer le profil.",
      preferencesSave: "Impossible d'enregistrer les préférences.", fieldsRequired: "Veuillez remplir tous les champs.",
      passwordLength: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      passwordMismatch: "Les mots de passe ne correspondent pas.", emailMissing: "Adresse email introuvable.",
      currentPassword: "Le mot de passe actuel est incorrect.", passwordUpdate: "Impossible de modifier le mot de passe.",
    },
    success: { avatar: "Photo de profil mise à jour.", cover: "Photo de couverture mise à jour.", profile: "Profil enregistré ✅", preferences: "Préférences enregistrées ✅", password: "Mot de passe mis à jour ✅" },
  },

  settings: {
    title: "Paramètres", subtitle: "Gérez votre compte et vos préférences.", profileTab: "Profil", notificationsTab: "Notifications", securityTab: "Sécurité", appearanceTab: "Apparence",
    errors: {
      notConnected: "Utilisateur non connecté.", nameRequired: "Le nom est obligatoire.", emailMissing: "Adresse email introuvable.",
      passwordFields: "Veuillez remplir tous les champs.", passwordLength: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      passwordMismatch: "Les nouveaux mots de passe ne correspondent pas.", oldPassword: "L'ancien mot de passe est incorrect.", save: "Impossible d'enregistrer",
      mfaSetup: "Configuration 2FA incomplète.", mfa: "Impossible d'activer la 2FA.", mfaCode: "Saisissez le code de vérification.",
      mfaVerify: "Code 2FA invalide ou vérification impossible.",
    },
    success: {
      profile: "Profil enregistré ✅", password: "Mot de passe mis à jour ✅", preferences: "Préférences enregistrées ✅",
      appearance: "Préférences d'apparence enregistrées ✅", generic: "Paramètres enregistrés ✅", mfaQr: "Scannez le QR code puis saisissez le code.",
      mfa: "Authentification à deux facteurs activée ✅",
    },
    avatar: { comingSoon: "Ajout de photo bientôt disponible." },
    badges: { emailVerified: "Email vérifié", authOk: "Authentification OK" },
    profileInfo: { title: "Informations du profil", description: "Les informations principales sont synchronisées avec votre profil KORA.", fullName: "Nom complet" },
    notifications: {
      title: "Préférences de notifications", description: "Choisissez les alertes que vous souhaitez recevoir.",
      emailTitle: "Notifications par email", emailDescription: "Tâches, réponses et rappels importants.", pushTitle: "Notifications push", pushDescription: "Alertes instantanées du navigateur.",
      marketingTitle: "Offres et actualités KORA", marketingDescription: "Nouveautés, événements et offres.", securityTitle: "Alertes de sécurité", securityDescription: "Connexions et changements sensibles.",
    },
    security: {
      passwordTitle: "Changer le mot de passe", passwordDescription: "Minimum 8 caractères. Votre mot de passe actuel sera vérifié.", currentPassword: "Mot de passe actuel",
      newPassword: "Nouveau mot de passe", confirmPassword: "Confirmer", update: "Mettre à jour", mfaTitle: "Authentification à deux facteurs",
      mfaDescription: "Ajoutez une couche de sécurité à votre compte KORA avec une application d'authentification.", mfaEnabled: "2FA activée", mfaEnable: "Activer la 2FA",
      mfaSecret: "Clé secrète", mfaCode: "Code de vérification", mfaVerify: "Vérifier et activer",
    },
    appearance: { title: "Apparence", description: "Personnalisez votre interface KORA.", theme: "Thème", light: "Clair", dark: "Sombre", auto: "Auto", language: "Langue de l'interface" },
    delete: {
      title: "Zone dangereuse", description: "La suppression de votre compte est définitive.", button: "Supprimer mon compte",
      confirm: "Voulez-vous vraiment supprimer votre compte ? Cette action est définitive.", success: "Votre compte a été supprimé.", error: "Impossible de supprimer le compte.",
    },
  },

  auth: {
    loginTitle: "Connexion", loginDescription: "Connectez-vous à votre compte KORA.", registerTitle: "Créer votre compte",
    registerDescription: "Rejoignez KORA et découvrez les talents africains.", email: "Adresse email", password: "Mot de passe", confirmPassword: "Confirmer le mot de passe",
    forgotPassword: "Mot de passe oublié ?", rememberMe: "Se souvenir de moi", login: "Se connecter", register: "Créer un compte", continue: "Continuer", logout: "Déconnexion",
    invalidCredentials: "Email ou mot de passe incorrect.", accountCreated: "Compte créé ✅", resetSent: "Un lien de réinitialisation a été envoyé à votre adresse email.",
    passwordReset: "Mot de passe réinitialisé ✅", minimumPassword: "8 caractères minimum.", passwordsMismatch: "Les mots de passe ne correspondent pas.",
  },

  legal: { conditions: "Conditions générales", privacy: "Politique de confidentialité", cookies: "Politique des cookies", legalNotice: "Mentions légales", faq: "FAQ", contact: "Contact", reportProblem: "Signaler un problème" },

  errors: {
    generic: "Une erreur est survenue.", loading: "Impossible de charger les données.", saving: "Impossible d'enregistrer les modifications.",
    notFound: "Page introuvable.", unauthorized: "Accès non autorisé.", sessionExpired: "Votre session a expiré. Veuillez vous reconnecter.",
    network: "Problème de connexion réseau.", server: "Le serveur a rencontré un problème.",
  },

  time: { justNow: "à l'instant", minutesAgo: "il y a {count} min", hoursAgo: "il y a {count}h", daysAgo: "il y a {count}j", yesterday: "hier" },
}

const en = {
  common: {
    appName: "KORA", language: "Language", french: "French", english: "English", loading: "Loading…", saving: "Saving...", saved: "Saved", save: "Save",
    cancel: "Cancel", close: "Close", clear: "Clear", apply: "Apply", confirm: "Confirm", delete: "Delete", edit: "Edit", create: "Create", update: "Update",
    back: "Back", next: "Next", previous: "Previous", search: "Search", filter: "Filter", sort: "Sort", reset: "Reset", refresh: "Refresh", submit: "Submit",
    send: "Send", view: "View", details: "Details", more: "More", less: "Less", optional: "Optional", required: "Required", retry: "Please try again.",
    success: "Success", error: "Error", warning: "Warning", information: "Information", active: "Active", inactive: "Inactive", available: "Available",
    unavailable: "Unavailable", public: "Public", private: "Private", verified: "Verified", unverified: "Unverified", online: "Online", offline: "Offline",
    today: "Today", yesterday: "Yesterday", now: "Just now", unknown: "Unknown", notProvided: "Not provided", noResults: "No results", noData: "No data",
    requiredFields: "Please fill in the required fields.", copyLink: "Copy link", copied: "Copied ✅", share: "Share", contact: "Contact", invite: "Invite", all: "All", clientKora: "KORA Client", noDescription: "No description.", and: "and", sendInvitation: "Send invitation",
  },
  navigation: { home: "Home", discover: "Discover", favorites: "My favorites", projects: "My projects", requests: "My requests", messages: "Messages", notifications: "Notifications", dashboard: "Dashboard", talents: "My talents", subscription: "Subscription", settings: "Settings", admin: "Administration", users: "Users", clients: "Clients", managers: "Managers", moderation: "Moderation", payments: "Payments", subscriptions: "Subscriptions", logs: "Logs", reports: "Reports" },
  account: { account: "Account", client: "Client", manager: "Manager", talent: "Talent", admin: "Administrator", profile: "My profile", logout: "Log out", login: "Log in", register: "Create an account", forgotPassword: "Forgot password?", resetPassword: "Reset password", email: "Email", password: "Password", confirmPassword: "Confirm password", name: "Full name" },
  premium: { title: "Go Premium", description: "Unlock all features", button: "Upgrade", upgrade: "Upgrade to Premium", plans: "View subscriptions" },
  seo: { siteTitle: "KORA — African Talent Platform", siteDescription: "Discover, contact and collaborate with African talents on KORA.", homeTitle: "KORA — Discover African talents", homeDescription: "Find African talents that match your needs and build collaborations with KORA.", categoriesTitle: "African Talent Categories | KORA", categoriesDescription: "Explore categories and discover African talents available on KORA.", browseTitle: "Discover Talents | KORA", browseDescription: "Search and discover African talents by skills, categories, countries and availability.", talentSuffix: "Talent", talentFallbackTitle: "African professional", talentFallbackDescription: "Discover this professional talent on KORA.", projectsTitle: "My Projects | KORA", messagesTitle: "Messages | KORA", settingsTitle: "Settings | KORA" },
  landing: { badge: "The African talent platform", titlePart1: "Africa's best talents,", titlePart2: "all in one place.", description: "Discover exceptional talents, connect directly with their managers and bring your projects to life.", discoverTalents: "Discover talents", createAccount: "Create an account", getStarted: "Get started", learnMore: "Learn more", whyKora: "Why KORA?", trustedTalents: "Published profiles", trustedTalentsDescription: "Discover profiles published on KORA with their listed skills and achievements.", directContact: "Direct contact", directContactDescription: "Connect directly with managers and move quickly on your projects.", securePayments: "Subscription payment", securePaymentsDescription: "Manager subscriptions are currently paid through SasPay.", howItWorks: "How it works", step1Title: "Find your talent", step1Description: "Search by your needs, budget, country or required skills.", step2Title: "Contact or invite", step2Description: "Contact the manager or invite the talent to an existing project.", step3Title: "Collaborate", step3Description: "Organize your collaboration and move your project forward.", featuredTalents: "Talents available", featuredDescription: "A selection of profiles available on KORA.", viewAllTalents: "View all talents", testimonials: "What people say about KORA", faq: "Frequently asked questions", finalCtaTitle: "Your next talent may already be on KORA.", finalCtaDescription: "Create your account and start discovering African talents." },
  categories: { title: "Discover talents by category", description: "Explore the different talent categories available on KORA.", all: "All categories", seeTalents: "View talents", featured: "Featured talents" },
  talents: { talent: "Talent", talents: "Talents", title: "Talents", myTalents: "My talents", addTalent: "Add a talent", createTalent: "Create talent profile", editTalent: "Edit talent", deleteTalent: "Delete talent", publishTalent: "Publish talent", unpublishTalent: "Unpublish talent", publish: "Publish", pending: "Pending", published: "Published", draft: "Draft", rejected: "Rejected", suspended: "Suspended", verified: "Verified", available: "Available", unavailable: "Unavailable", searchPlaceholder: "Search a talent, skill or city...", noTalents: "No talent found.", firstName: "First name", lastName: "Last name", fullName: "Full name", titleLabel: "Professional title", category: "Category", country: "Country", city: "City", location: "Location", bio: "Description / Bio", skills: "Skills", rate: "Rate", dailyRate: "Daily rate", currency: "Currency", portfolio: "Portfolio", photos: "Photos", videos: "Videos", links: "Links", manager: "Manager", rating: "Rating", reviews: "Reviews", completedProjects: "Completed projects", availability: "Availability", newMission: "Accepting new assignments", viewProfile: "View profile", contact: "Contact", invite: "Invite to a project", share: "Share profile", verifiedKora: "KORA Verified", noSkills: "No skills provided.", noPortfolio: "No portfolio item yet." },
  talent: { profile: "Talent Profile", profileOf: "Profile of", about: "About", skills: "Skills", availability: "Availability", dailyRate: "Daily rate", rating: "Rating", reviews: "Reviews", projects: "Projects", portfolio: "Portfolio", manager: "Manager", managerDescription: "Person responsible for this talent.", verifiedKora: "KORA Verified", available: "Available", unavailable: "Unavailable", acceptsMissions: "The talent is accepting new assignments.", noLongerAccepting: "The talent is not accepting new assignments at the moment.", noDescription: "No description provided.", locationMissing: "Location not provided.", categoryMissing: "Category not provided.", noManager: "Manager information unavailable.", inviteTitle: "Invite to a project", inviteDescription: "Select one of your active projects.", selectProject: "Select a project…", noProject: "No project available. Create a project first from your Client area.", invitationMessage: "Invitation message (optional)", invitationSent: "Invitation sent ✅", invitationDescription: "The request was sent to the talent manager.", contactManager: "Contact manager", openingConversation: "Opening…", projectNotFound: "Project not found.", talentUnavailable: "Talent unavailable", notPublished: "This profile is not publicly published. Only the owner manager or an administrator can currently view it.", portfolioExternalLink: "External link", portfolioVideo: "Video", portfolioImage: "Image", portfolioDocument: "Document", shareProfile: "Share this profile", shareDevice: "Share with device", whatsapp: "WhatsApp", facebook: "Facebook", x: "X", copied: "Profile link copied ✅", managerUnavailable: "The talent manager is unavailable.", loginToFavorite: "Log in to save this talent to your favorites.", loginToContact: "Log in to contact this talent.", loginToInvite: "Log in to invite this talent.", ownTalent: "This talent is managed by your own account.", conversationNotFound: "Conversation not found.", favoriteError: "Unable to update your favorites.", shareError: "Unable to share this profile.", copyError: "Unable to copy the link.", contactError: "Unable to open the conversation.", inviteError: "Unable to send the invitation.", loadProjectsError: "Unable to load your projects.", sendInvitation: "Send invitation" },
  browse: { title: "Discover talents", description: "Find the talent that fits your project.", search: "Search a talent...", category: "Category", country: "Country", availability: "Availability", availableOnly: "Available only", verifiedOnly: "Verified profiles only", price: "Daily rate", minPrice: "Minimum rate", maxPrice: "Maximum rate", sortBy: "Sort by", relevance: "Relevance", newest: "Newest", rating: "Highest rated", priceLow: "Lowest rate", priceHigh: "Highest rate", resetFilters: "Reset filters", applyFilters: "Apply filters", results: "results", result: "result", previous: "Previous", next: "Next", noResults: "No talent matches your criteria." },
  favorites: { title: "My favorites", description: "Find the talents you saved.", empty: "You don't have any favorites yet.", discover: "Discover talents", remove: "Remove from favorites", add: "Add to favorites" },
  projects: { title: "My Projects", description: "Create and manage your projects.", create: "Create a project", new: "New project", edit: "Edit project", detail: "Project details", titleLabel: "Project title", descriptionLabel: "Description", budget: "Budget", budgetMin: "Minimum budget", budgetMax: "Maximum budget", currency: "Currency", dueDate: "Due date", status: "Status", draft: "Draft", open: "Open", pending: "Pending", active: "Active", completed: "Completed", cancelled: "Cancelled", save: "Save project", update: "Update project", delete: "Delete project", cancel: "Cancel project", noProjects: "No projects.", projectCreated: "Project created ✅", projectUpdated: "Project updated ✅", projectDeleted: "Project deleted ✅", confirmDelete: "Are you sure you want to delete this project?" },
  requests: { title: "My requests", description: "Track your requests and invitations.", request: "Request", requests: "Requests", pending: "Pending", accepted: "Accepted", rejected: "Rejected", cancelled: "Cancelled", sent: "Sent", received: "Received", project: "Project", talent: "Talent", manager: "Manager", client: "Client", budget: "Budget", details: "Request details", accept: "Accept", reject: "Reject", view: "View request", invitation: "Invitation", invitationSent: "Invitation sent", noRequests: "No requests.", noRequestsDescription: "You currently have no requests." },
  requestForm: { badge: "Collaboration request", title: "Describe your project", forTalent: "For {talent}", openButton: "Send a request", projectTitle: "Project title", projectTitlePlaceholder: "E.g. Coca-Cola advertising campaign", projectType: "Project type", selectType: "Select a type…", description: "Description", descriptionPlaceholder: "Describe what you want to accomplish with this talent…", dateStart: "Date / period start", dateEnd: "Period end", budget: "Proposed budget (optional)", location: "Location", locationPlaceholder: "E.g. Ouagadougou, Burkina Faso", additionalInfo: "Additional information", additionalInfoPlaceholder: "Constraints, deliverables, schedules, references, etc.", notice: "The request contains the project context directly. The manager can review it, reply, accept or reject the collaboration.", submit: "Send request", titleRequired: "Project title is required.", descriptionRequired: "Project description is required.", dateInvalid: "The period end cannot be before the start.", sent: "Request sent ✅", sentDescription: "The talent manager received the project information.", error: "Unable to send the request", types: { advertising: "Advertising", event: "Event", musicVideo: "Music video", shooting: "Shooting", socialCampaign: "Social media campaign", fashion: "Fashion", filmTv: "Film / TV", other: "Other" } },
  messages: { title: "Messages", conversations: "Conversations", newConversation: "New conversation", search: "Search a conversation", placeholder: "Write your message...", send: "Send", online: "Online", offline: "Offline", realtime: "Real-time", noConversations: "No conversations.", noMessages: "No messages.", loading: "Loading messages…", opening: "Opening…", back: "Back", unread: "unread", unreadPlural: "unread" },
  notifications: { title: "Notifications", description: "View your alerts and updates.", markRead: "Mark as read", markAllRead: "Mark all as read", all: "All", unread: "Unread", read: "Read", noNotifications: "No notifications.", noUnread: "No unread notifications.", descriptionEmpty: "Important notifications will appear here.", invitation: "New invitation", request: "Request update", message: "New message", payment: "Payment", subscription: "Subscription", security: "Security" },
  home: { searchPlaceholder: "Search for a talent, a service...", welcomeBack: "Welcome back to {name}!", welcomeUser: "Welcome, {name}", clientIntro: "Find the best African talents to grow your project. Let us guide you!", managerIntro: "Manager dashboard: manage your talents, track your projects and optimize your collaborations.", adminIntro: "Administrator dashboard: view the platform global statistics.", realtimeStats: "Key statistics in real time", koraSelection: "KORA Selection", recommendedTalents: "Talents recommended for you", recommendedDescription: "Selected based on your activity and preferences", from: "From", loadingRecommended: "Loading recommended talents...", noPublishedTalents: "No published talent yet.", latestActions: "Latest actions", projectsCompleted: "projects" },

  clientUi: {
    dashboard: {
      loading: "Loading your dashboard…", hello: "Hello, {name}",
      welcome: "Welcome to your KORA dashboard", search: "Search",
      newRequest: "New request", requestsSent: "Requests sent", requestsAccepted: "Requests accepted",
      favoriteTalents: "Favorite talents", spentBudget: "Budget spent", recentRequests: "Recent requests",
      recentRequestsDescription: "Your recent requests to managers", seeAll: "View all",
      noRequests: "No requests", noRequestsDescription: "You have not sent any requests yet.",
      exploreTalents: "Explore talents", recentTalents: "Recent talents",
      recentTalentsDescription: "Talents currently available on KORA",
      noTalents: "No talents available", noPublicProfiles: "No public profiles are currently available.",
      viewAllTalents: "View all talents", activity: "Your activity",
      activityDescription: "Data will appear here as you use KORA.",
      searches: "Searches", savedSearches: "Saved talent searches",
      favorites: "Favorites", savedTalents: "Saved talents", requests: "Requests",
      noSentRequests: "Requests sent", unknown: "Unknown", talent: "Talent", you: "you",
      latestActions: "Latest actions", category: "Category",
    },
    favorites: {
      title: "My favorites", savedCount: "{count} saved talent(s)",
      searchPlaceholder: "Search your favorites…", loading: "Loading",
      noFavorites: "No favorites yet",
      noFavoritesDescription: "Save talents you like to find them easily and compare their profiles.",
      discover: "Discover talents", howItWorks: "How does it work?",
      clickOn: "Click on", clickOnDescription: "the heart icon on a profile",
      findThem: "Find them", findThemDescription: "here, at any time",
      sendRequests: "Send", sendRequestsDescription: "requests in one click",
      noResults: "No results", noResultsDescription: "None of your favorites match “{search}”.",
      managerUnavailable: "The talent's manager is unavailable.",
      ownTalent: "This talent is managed by your own account.",
      openConversation: "Opening…", contact: "Contact", removeError: "Unable to remove this favorite.",
      loadingError: "Unable to load your favorites right now.", contactError: "Unable to open the conversation.",
    },
    notifications: {
      title: "Notifications", refresh: "Refresh", markAllRead: "Mark all as read",
      markRead: "Mark as read", loadError: "Unable to load notifications.",
      markReadError: "Unable to mark the notification as read.",
      markAllError: "Unable to mark notifications.", markedAllRead: "Notifications marked as read.",
      none: "No notifications", noUnread: "You have no unread notifications.",
      emptyDescription: "Important notifications will appear here.",
      fallbackTitle: "KORA notification", new: "New", page: "Page {page}", of: "of {totalPages}",
      total: "{count} notification(s)", previous: "Previous", next: "Next",
    },
    projects: {
      area: "Client area", title: "My projects", count: "{count} saved project(s)",
      refresh: "Refresh", create: "Create a project", searchPlaceholder: "Search projects…",
      clearSearch: "Clear search", loadError: "Unable to load your projects.",
      loading: "Loading", noResults: "No projects found", none: "No projects",
      searchNoMatch: "No projects match your search.",
      createFirst: "Create your first project to keep it here and start working with KORA talents.",
      budget: "Budget", dueDate: "Due date", dueDateMissing: "Not set", details: "Details",
      cancel: "Cancel", cancelConfirm: "Cancel project “{title}”?",
      cancelError: "Unable to cancel the project.", cancelled: "Project cancelled.",
      undefinedBudget: "Budget not defined", page: "Page {page}", of: "of {totalPages}",
      previous: "Previous", next: "Next", titleLabel: "Project title", descriptionLabel: "Description",
      minBudget: "Minimum budget", maxBudget: "Maximum budget", currency: "Currency",
      save: "Save project", saveChanges: "Save changes",
      newProject: "New project", projectInfo: "Project information", titlePlaceholder: "E.g. KORA website redesign",
      descriptionPlaceholder: "Describe the context, goals, deliverables and expectations.",
      minBudgetInvalid: "Minimum budget is invalid.", maxBudgetInvalid: "Maximum budget is invalid.",
      budgetRangeInvalid: "Minimum budget cannot exceed the maximum.",
      titleRequired: "Project title is required.", descriptionRequired: "Project description is required.",
      saveError: "Unable to save the project.", created: "Project saved ✅", updated: "Project updated ✅",
      status: "Status", back: "Back", rateProject: "Project review",
      noEligibleTalents: "No eligible talent is linked to this project.",
      messages: "Messages", cancelProject: "Cancel project", completed: "Completed",
    },
    requests: {
      area: "Client area", title: "My requests", count: "{count} request(s)",
      refresh: "Refresh", loadError: "Unable to load your requests.",
      none: "No requests sent.", invitation: "Invitation", project: "Project:",
      talent: "Talent:", viewTalent: "View talent", previous: "Previous", next: "Next",
      page: "Page {page}", of: "of {totalPages}",
    },
    review: {
      unavailable: "Review unavailable", backToProject: "Back to project",
      notComplete: "This project is not completed yet", noReviews: "No reviews to publish",
      allReviewed: "All talents linked to this project have already been reviewed, or no talent is currently eligible.",
      title: "Review project", projectComplete: "Project completed — your review will be linked to the project and selected talent.",
      yourReview: "Your review", ratingCommentRequired: "A rating from 1 to 5 and a comment are required.",
      talent: "Reviewed talent", rating: "Rating", comment: "Comment",
      commentPlaceholder: "Share your experience with this talent…", cancel: "Cancel",
      submit: "Publish my review", loadError: "Unable to prepare the review.",
      projectNotFound: "Project not found or inaccessible.", eligibleTalentMissing: "No eligible talent to review.",
      chooseRating: "Choose a rating from 1 to 5.", commentRequired: "Add a comment.",
      saved: "Review saved ✅", saveError: "Unable to save the review.",
    },
  },

  dashboard: { title: "Dashboard", welcome: "Welcome to KORA.", overview: "Overview", recentActivity: "Recent activity", statistics: "Statistics", totalProjects: "Total projects", activeProjects: "Active projects", completedProjects: "Completed projects", pendingRequests: "Pending requests", talents: "Talents", messages: "Messages", notifications: "Notifications", unreadMessages: "Unread messages", noActivity: "No recent activity." },
  manager: { dashboard: "Manager Dashboard", myTalents: "My talents", myRequests: "Requests", subscription: "Subscription", manageTalent: "Manage your talents and their visibility.", createTalent: "Create talent", pending: "Pending", published: "Published", total: "Total", averageRating: "Average rating",
    loading: "Loading dashboard...", errorLoad: "Unable to load dashboard data.", retry: "Retry", manageTalents: "Manage your talents and track your requests.",
    activeRequests: "Active requests", revenue: "Revenue", settledTransactions: "Settled transactions", requestActivity: "Request activity",
    requestsLast7Days: "Requests received over the last 7 days", quickManagement: "Quick management", quickManagementDescription: "Quickly access your talents.",
    editMyTalents: "Edit my talents", talentsManaged: "Talents you currently manage.", manageMyTalents: "Manage my talents", searchTalent: "Search for a talent...",
    noTalentFound: "No talent found", noTalent: "No talents", noTalentMatch: "No talent matches your search.",
    addTalentHint: "Start by adding a talent to your manager space.", manageTalentLabel: "Manage talent", noNotifications: "No notifications",
    recentRequests: "Recent requests", recentRequestsDescription: "The latest requests received in your space.", viewRequests: "View requests",
    noRequests: "No requests yet.", open: "Open", requestNumber: "Request #{id}", undefinedStatus: "Status not defined" ,
    availabilityLabel: "Availability", artistFee: "Talent fee", showFeePublicly: "Show fee publicly", profilePhoto: "Profile photo", currentTalentPhoto: "Current talent photo", coverPhoto: "Cover photo", photosVideos: "Photos / videos", imageUploadHint: "1 image · JPG, PNG, WebP or GIF · 5 MB max.", coverUploadHint: "1 image · landscape format recommended · 5 MB max.", workflow: "Manager workflow",
    clientContact: "Contact client", projectContext: "Project context", projectManagement: "Project management", markCompleted: "Mark completed", sendReply: "Send reply", accept: "Accept", reject: "Reject", paymentRecorded: "Your payment has been recorded. A KORA administrator must confirm it before activation.", paymentHistory: "Payment history", saspayPending: "SasPay payments remain pending until validated by an authorized administrator.", choosePlan: "Choose your plan. Pro and Business subscription payments are manually validated by KORA.", retainedData: "Your talents and history remain associated with your account.", projectManagementFeatures: "Request and project management", managerTools: "KORA manager tools", saspayValidation: "SasPay payment + KORA validation", changeCover: "Change cover", uploading: "Uploading…", cover: "Cover", profile: "Profile",
    planFree1: "1 talent maximum", planProfilePortfolio: "Talent profile and portfolio", planFee: "Fee management", planRequests: "Request management", planMessaging: "Messaging and notifications", planBasicTalent: "Basic talent management", planTrial: "30 days free access", planPro1: "3 talents maximum", planFreeFeatures: "All Free plan features", planOperations: "Operational project management", planManagerProfile: "Manager profile", planBusiness1: "Unlimited talents", planProFeatures: "All Pro plan features", planBusinessBadge: "Business badge on your profile", planUnlimited: "Unlimited talent organization", activePlan: "Active plan", trialEnded: "Trial ended", useFree: "Use for free", choosePlanButton: "Choose {name}", noPaidSubscription: "No paid subscription", monthlySubscription: "Monthly subscription", perMonth: "/ month",
    replyPlaceholder: "Write your reply to the client…", createdWithRequest: "Created with the request", alreadyProcessed: "This request has already been processed.", requestAccepted: "Request accepted.", requestRejected: "Request rejected.", projectCompleted: "Project marked as completed.", projectStatusUpdated: "Project status updated.",
    expiredMulti: "For managers who manage multiple talents.", expiredThree: "For managing up to 3 talents.", preparing: "Preparing...", resubscribe: "Resubscribe",
  },
  admin: { title: "Administration", dashboard: "Dashboard", controlCenter: "KORA Control Center", dataSource: "All displayed data comes from the available Supabase tables.", users: "Users", clients: "Clients", managers: "Managers", admins: "Administrators", talents: "Talents", publishedTalents: "Published talents", pendingTalents: "Pending talents", projects: "Projects", requests: "Requests", messages: "Messages", conversations: "Conversations", reports: "Reports", moderation: "Moderation", subscriptions: "Subscriptions", payments: "Payments", logs: "Logs", settings: "Administration settings", suspendedUsers: "Suspended users", openProjects: "Open projects", activeProjects: "Active projects", completedProjects: "Completed projects", pendingRequests: "Pending requests", acceptedRequests: "Accepted requests", rejectedRequests: "Rejected requests", pendingReports: "Pending reports", activeSubscriptions: "Active subscriptions", expiredSubscriptions: "Expired subscriptions", pendingPayments: "Pending payments", paidPayments: "Paid payments", failedPayments: "Failed payments", transactions: "Transactions", administration: "Administration" },
  moderation: { title: "Moderation", reports: "Reports", pending: "Pending", reviewed: "Reviewed", resolved: "Resolved", dismissed: "Dismissed", suspend: "Suspend", reactivate: "Reactivate", hide: "Hide", publish: "Publish", reject: "Reject", noReports: "No reports." },
  payments: { title: "Payments", payment: "Payment", payments: "Payments", pending: "Pending", paid: "Paid", failed: "Failed", cancelled: "Cancelled", provider: "Provider", reference: "Reference", amount: "Amount", currency: "Currency", date: "Date", method: "Method", status: "Status", orangeMoney: "Orange Money", moovMoney: "Moov Money", wave: "Wave", card: "Bank card", visa: "Visa", mastercard: "Mastercard" },
  subscriptions: { title: "Subscriptions", subscription: "Subscription", trial: "Trial period", active: "Active", expired: "Expired", cancelled: "Cancelled", pending: "Pending", plan: "Plan", startDate: "Start date", endDate: "End date", period: "Period", upgrade: "Upgrade", renew: "Renew" },
  reviews: { title: "Reviews", review: "Review", reviews: "Reviews", rating: "Rating", comment: "Comment", submit: "Publish my review", noReviews: "No reviews yet.", thankYou: "Thank you for your review." },
  clientSettings: {
    tabs: { profile: "My profile", preferences: "Preferences", notifications: "Notifications", security: "Security" },
    profile: {
      title: "My profile", description: "Personal information for your account.",
      cover: "Cover", changeCover: "Change cover", uploadInProgress: "Uploading image…",
      avatar: "Profile photo", photoAndCover: "Profile photo and cover", fullName: "Full name",
      phone: "Phone", city: "City", company: "Company", bio: "Biography",
      personalData: "Manage my personal data →",
    },
    preferences: { title: "Preferences", description: "Language and appearance of your space.", language: "Language", theme: "Theme", light: "Light", dark: "Dark", auto: "Auto", save: "Save preferences" },
    notifications: { title: "Notifications", description: "Choose the alerts you want to receive.", email: "Email notifications", browser: "Browser notifications", marketing: "KORA offers and updates", save: "Save" },
    security: { title: "Security", description: "Change your password.", currentPassword: "Current password", newPassword: "New password", confirmPassword: "Confirm", update: "Update" },
    loading: "Loading settings…",
    errors: {
      load: "Unable to load your settings.", upload: "Unable to upload the image.",
      nameRequired: "Name is required.", profileSave: "Unable to save the profile.",
      preferencesSave: "Unable to save preferences.", fieldsRequired: "Please fill in all fields.",
      passwordLength: "The new password must contain at least 8 characters.",
      passwordMismatch: "The passwords do not match.", emailMissing: "Email address not found.",
      currentPassword: "The current password is incorrect.", passwordUpdate: "Unable to update the password.",
    },
    success: { avatar: "Profile photo updated.", cover: "Cover photo updated.", profile: "Profile saved ✅", preferences: "Preferences saved ✅", password: "Password updated ✅" },
  },

  settings: {
    title: "Settings", subtitle: "Manage your account and preferences.", profileTab: "Profile", notificationsTab: "Notifications", securityTab: "Security", appearanceTab: "Appearance",
    errors: { notConnected: "User not connected.", nameRequired: "Name is required.", emailMissing: "Email address not found.", passwordFields: "Please fill in all fields.", passwordLength: "The new password must contain at least 8 characters.", passwordMismatch: "The new passwords do not match.", oldPassword: "The current password is incorrect.", save: "Unable to save.", mfaSetup: "Incomplete 2FA configuration.", mfa: "Unable to enable 2FA.", mfaCode: "Enter the verification code.", mfaVerify: "Invalid 2FA code or verification failed." },
    success: { profile: "Profile saved ✅", password: "Password updated ✅", preferences: "Preferences saved ✅", appearance: "Appearance preferences saved ✅", generic: "Settings saved ✅", mfaQr: "Scan the QR code and enter the code.", mfa: "Two-factor authentication enabled ✅" },
    avatar: { comingSoon: "Photo upload coming soon." }, badges: { emailVerified: "Email verified", authOk: "Authentication OK" },
    profileInfo: { title: "Profile information", description: "Main information is synchronized with your KORA profile.", fullName: "Full name" },
    notifications: { title: "Notification preferences", description: "Choose the alerts you want to receive.", emailTitle: "Email notifications", emailDescription: "Tasks, replies and important reminders.", pushTitle: "Push notifications", pushDescription: "Instant browser alerts.", marketingTitle: "KORA offers and news", marketingDescription: "New features, events and offers.", securityTitle: "Security alerts", securityDescription: "Logins and sensitive changes." },
    security: { passwordTitle: "Change password", passwordDescription: "Minimum 8 characters. Your current password will be verified.", currentPassword: "Current password", newPassword: "New password", confirmPassword: "Confirm", update: "Update", mfaTitle: "Two-factor authentication", mfaDescription: "Add an extra layer of security to your KORA account using an authenticator app.", mfaEnabled: "2FA enabled", mfaEnable: "Enable 2FA", mfaSecret: "Secret key", mfaCode: "Verification code", mfaVerify: "Verify and enable" },
    appearance: { title: "Appearance", description: "Customize your KORA interface.", theme: "Theme", light: "Light", dark: "Dark", auto: "Auto", language: "Interface language" },
    delete: { title: "Danger zone", description: "Deleting your account is permanent.", button: "Delete my account", confirm: "Are you sure you want to delete your account? This action is permanent.", success: "Your account has been deleted.", error: "Unable to delete the account." },

  },
  auth: { loginTitle: "Log in", loginDescription: "Sign in to your KORA account.", registerTitle: "Create your account", registerDescription: "Join KORA and discover African talents.", email: "Email address", password: "Password", confirmPassword: "Confirm password", forgotPassword: "Forgot password?", rememberMe: "Remember me", login: "Log in", register: "Create an account", continue: "Continue", logout: "Log out", invalidCredentials: "Incorrect email or password.", accountCreated: "Account created ✅", resetSent: "A reset link has been sent to your email address.", passwordReset: "Password reset ✅", minimumPassword: "Minimum 8 characters.", passwordsMismatch: "Passwords do not match." },
  legal: { conditions: "Terms and conditions", privacy: "Privacy policy", cookies: "Cookie policy", legalNotice: "Legal notice", faq: "FAQ", contact: "Contact", reportProblem: "Report a problem" },
  errors: { generic: "An error occurred.", loading: "Unable to load the data.", saving: "Unable to save the changes.", notFound: "Page not found.", unauthorized: "Unauthorized access.", sessionExpired: "Your session has expired. Please log in again.", network: "Network connection problem.", server: "The server encountered a problem." },
  time: { justNow: "just now", minutesAgo: "{count} min ago", hoursAgo: "{count}h ago", daysAgo: "{count}d ago", yesterday: "yesterday" },
}

export const translations = { fr, en }

function getInitialLanguage() {
  if (typeof window === "undefined") return "fr"
  return readStoredLanguage(window.localStorage, null) || "fr"
}

function getNestedValue(source, path) {
  if (!source || !path) return undefined
  return path.split(".").reduce((current, key) => (current && Object.prototype.hasOwnProperty.call(current, key) ? current[key] : undefined), source)
}

function replaceVariables(value, variables = {}) {
  if (typeof value !== "string") return value
  return value.replace(/\{(\w+)\}/g, (_, key) => variables[key] ?? `{${key}}`)
}

function normalizeTheme(value) {
  return value === "dark" || value === "light" || value === "auto" ? value : DEFAULT_THEME
}

function getInitialTheme() {
  if (typeof window === "undefined") return DEFAULT_THEME

  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    const explicitlySelected = window.localStorage.getItem(THEME_EXPLICIT_STORAGE_KEY) === "1"

    // Light is Kora's default. The old version used "auto" by default, so
    // migrate that legacy value once unless the user explicitly chose a theme.
    if (saved === "auto" && !explicitlySelected) {
      window.localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME)
      return DEFAULT_THEME
    }

    return normalizeTheme(saved)
  } catch {}

  return DEFAULT_THEME
}

function resolveTheme(theme) {
  if (theme === "dark" || theme === "light") return theme
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme) {
  if (typeof document === "undefined") return

  const resolvedTheme = resolveTheme(theme)
  const root = document.documentElement

  root.classList.toggle("dark", resolvedTheme === "dark")
  root.dataset.theme = theme
  root.style.colorScheme = resolvedTheme
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage)
  const [activeUserId, setActiveUserId] = useState(null)
  const [theme, setThemeState] = useState(getInitialTheme)

  const setLanguage = (nextLanguage) => {
    const normalized = normalizeLanguage(nextLanguage)
    setLanguageState(normalized)
    try {
      window.localStorage.setItem(getLanguageStorageKey(activeUserId), normalized)
      // Keep the legacy global key only for signed-out visitors; authenticated
      // users are stored under their own ID to prevent language leakage.
      if (!activeUserId) window.localStorage.setItem(STORAGE_KEY, normalized)
    } catch {}
  }

  const setTheme = (nextTheme) => {
    const normalized = normalizeTheme(nextTheme)
    setThemeState(normalized)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, normalized)
      window.localStorage.setItem(THEME_EXPLICIT_STORAGE_KEY, "1")
    } catch {}
    applyTheme(normalized)
  }

  useEffect(() => {
    let mounted = true
    let lastUserId

    async function applySessionLanguage(session) {
      const userId = session?.user?.id || null
      if (userId === lastUserId) return
      lastUserId = userId
      if (mounted) setActiveUserId(userId)

      if (!userId) {
        if (mounted) setLanguageState(getInitialLanguage())
        return
      }

      const localPreference = typeof window !== "undefined"
        ? readStoredLanguage(window.localStorage, userId)
        : null
      if (localPreference) {
        if (mounted && lastUserId === userId) setLanguageState(localPreference)
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", userId)
        .maybeSingle()

      if (!mounted || lastUserId !== userId) return
      const preferences = data?.preferences && typeof data.preferences === "object" ? data.preferences : {}
      const preferredLanguage = isSupportedLanguage(preferences.language) ? preferences.language : "fr"
      setLanguageState(preferredLanguage)
      try {
        window.localStorage.setItem(getLanguageStorageKey(userId), preferredLanguage)
      } catch {}
      if (error) console.warn("KORA: impossible de charger la préférence de langue du compte.")
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && session?.user?.id === lastUserId) return
      Promise.resolve().then(() => applySessionLanguage(session))
    })
    supabase.auth.getSession()
      .then(({ data }) => applySessionLanguage(data?.session || null))
      .catch(() => applySessionLanguage(null))

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const config = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.fr
    document.documentElement.lang = config.htmlLang
    document.documentElement.dataset.language = language
  }, [language])

  useEffect(() => {
    applyTheme(theme)

    if (typeof window === "undefined") return undefined

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemThemeChange = () => {
      if (theme === "auto") applyTheme("auto")
    }

    mediaQuery.addEventListener?.("change", handleSystemThemeChange)
    return () => mediaQuery.removeEventListener?.("change", handleSystemThemeChange)
  }, [theme])

  const value = useMemo(() => {
    const dictionary = translations[language] || translations.fr
    const t = (key, fallback = key, variables = {}) => {
      let translated = getNestedValue(dictionary, key)
      if (typeof translated !== "string") translated = getNestedValue(translations.fr, key)
      if (typeof translated !== "string") translated = fallback
      return replaceVariables(translated, variables)
    }
    return {
      language,
      setLanguage,
      theme,
      setTheme,
      isDark: resolveTheme(theme) === "dark",
      t,
      isFrench: language === "fr",
      isEnglish: language === "en",
      languageConfig: SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.fr,
    }
  }, [language, theme, activeUserId])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error("useI18n doit être utilisé à l'intérieur de I18nProvider.")
  return context
}

export function LanguageSwitcher({ compact = false, showLabel = false, className = "" }) {
  const { language, setLanguage, t } = useI18n()
  const nextLanguage = language === "fr" ? "en" : "fr"
  const nextConfig = SUPPORTED_LANGUAGES[nextLanguage]
  const currentConfig = SUPPORTED_LANGUAGES[language]

  return (
    <button
      type="button"
      onClick={() => setLanguage(nextLanguage)}
      className={["inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2 text-sm font-semibold transition-all hover:border-gold/40 hover:bg-gold/5 focus:outline-none focus:ring-2 focus:ring-gold/40", className].filter(Boolean).join(" ")}
      aria-label={`${t("common.language")}: ${nextConfig.label}`}
      title={`${t("common.language")}: ${nextConfig.label}`}
    >
      {!compact && <Languages className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
      <span aria-hidden="true">{currentConfig.flag}</span>
      {(showLabel || !compact) && <span>{currentConfig.code.toUpperCase()}</span>}
      <span className="text-muted-foreground">→</span>
      <span aria-hidden="true">{nextConfig.flag}</span>
      {(showLabel || !compact) && <span className="text-muted-foreground">{nextConfig.code.toUpperCase()}</span>}
    </button>
  )
}

export function LanguageSelect({ className = "" }) {
  const { language, setLanguage, t } = useI18n()
  return (
    <div className={["inline-flex items-center gap-2", className].filter(Boolean).join(" ")}>
      <Globe2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        aria-label={t("common.language")}
        className="h-10 rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none transition-colors focus:border-gold"
      >
        <option value="fr">🇫🇷 Français</option>
        <option value="en">🇬🇧 English</option>
      </select>
    </div>
  )
}

export { fr, en, STORAGE_KEY, THEME_STORAGE_KEY }

export default { translations, SUPPORTED_LANGUAGES, I18nProvider, useI18n, LanguageSwitcher, LanguageSelect }
