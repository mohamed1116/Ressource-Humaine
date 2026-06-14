# JOURNAL DES MODIFICATIONS — HRMS FPT
> Toutes les modifications apportées au projet lors de nos sessions de travail

---

# ✅ MODIFICATIONS DÉJÀ EFFECTUÉES

## 1. Correction de `requirements.txt`
**Fichier :** `hrms-backend/requirements.txt`

| Action | Bibliothèque | Raison |
|--------|-------------|--------|
| ✅ Ajouté | `xhtml2pdf>=0.2.11` | Utilisée dans `pdf_service.py` mais absente du fichier |
| ❌ Supprimé | `statsmodels>=0.14` | Non utilisée dans le code |
| ❌ Supprimé | `scipy>=1.11` | Non utilisée dans le code |
| ❌ Supprimé | `joblib>=1.3` | Non utilisée dans le code |
| ✅ Conservé | `scikit-learn` | Utilisée dans le moteur IA |

---

## 2. Ajout du Rate Limiting (protection API)
**Fichier :** `hrms-backend/config/settings/base.py`

```python
'DEFAULT_THROTTLE_CLASSES': [
    'rest_framework.throttling.AnonRateThrottle',
    'rest_framework.throttling.UserRateThrottle',
],
'DEFAULT_THROTTLE_RATES': {
    'anon': '30/minute',
    'user': '200/minute',
}
```

---

## 3. Amélioration du moteur IA — Régression Linéaire
**Fichier :** `hrms-backend/apps/ai_engine/analytics/leave_analyzer.py`

- ❌ Avant : Moyenne mobile simple
- ✅ Après : `LinearRegression` de `scikit-learn` avec encodage cyclique de la saisonnalité (`month_sin`, `month_cos`) et intervalles de confiance réels

---

## 4. Tests unitaires du moteur IA — 16 tests, tous réussis ✅
**Fichier :** `hrms-backend/apps/ai_engine/tests.py`

16 tests couvrant `AttendanceAnalyzer`, `LeaveAnalyzer`, et `Recommender`.

---

## 5. Protection des fichiers sensibles
**Fichier :** `hrms-frontend/.gitignore` — ajout de `.env`
**Fichier créé :** `hrms-frontend/.env.example`

---

## 6. Publication du projet sur GitHub
- Repository : `https://github.com/mohamed1116/Ressource-Humaine`
- Branche : `AMSOUNT-MOHAMED` + `main`
- Fichiers exclus : `db.sqlite3`, `.env`, `venv/`, `media/`

---

## 7. Correction de la page AI Insights
**Fichier :** `hrms-frontend/src/pages/ai/AIInsightsPage.tsx`

Correction des noms de fonctions et de clés incorrects (`getLeavePredictions` → `getLeaveForecast`, etc.)

---

## 8. Ajout de la route et du lien vers AI Insights
**Fichiers :** `router/index.tsx` + `Sidebar.tsx`

---

## 9. Commande de données de démonstration pour le moteur IA
**Fichier :** `hrms-backend/apps/ai_engine/management/commands/seed_ai_demo.py`

```bash
python manage.py seed_ai_demo          # Ajoute 512 présences + 47 congés
python manage.py seed_ai_demo --clear  # Supprime les données de démo
```

---

## 10. Fusion des pages Départements et Personnel
**Fichier :** `hrms-frontend/src/pages/employees/EmployeeListPage.tsx`

- Vue unifiée : chaque département affiche ses employés dans un tableau dépliable
- Formulaire d'ajout de département (nom, code)
- Formulaire d'ajout d'employé (13 champs)
- Lien séparé "Départements" supprimé de la Sidebar

---

## 11. Correction du Serializer des employés
**Fichier :** `hrms-backend/apps/employees/serializers.py`

- Correction de l'erreur `redundant source` sur `full_name`
- Ajout de `department_id` pour le regroupement côté frontend

---

## 12. Augmentation de `max_page_size`
**Fichier :** `hrms-backend/apps/core/pagination.py`

`max_page_size` : `100` → `500`

---

## 13. Réparation de l'environnement de développement
- Nouveau `venv` avec Python 3.13
- Rétrogradation Vite v8 → v6 (incompatibilité Node v24)
- Suppression du cache Vite

---
---

# 🔴 À FAIRE — PRIORITÉ HAUTE (bloquant avant présentation)

## A. Traduire 3 pages encore en anglais

### `hrms-frontend/src/pages/salary/SalaryListPage.tsx`
| Anglais | Français |
|---------|----------|
| `"Salary & Payslips"` | `"Salaires & Bulletins de paie"` |
| `"Loading..."` | `"Chargement..."` |
| `"Employee"` | `"Employé"` |
| `"Period"` | `"Période"` |
| `"Base"` | `"Salaire de base"` |
| `"Gross"` | `"Brut"` |
| `"Tax"` | `"Impôt"` |
| `"Net"` | `"Net à payer"` |
| `"Status"` | `"Statut"` |
| `"No payslips found."` | `"Aucun bulletin de paie trouvé."` |

### `hrms-frontend/src/pages/performance/EvaluationListPage.tsx`
| Anglais | Français |
|---------|----------|
| `"Performance Evaluations"` | `"Évaluations de performance"` |
| `"Loading..."` | `"Chargement..."` |
| `"Employee"` | `"Employé"` |
| `"Period"` | `"Période"` |
| `"Status"` | `"Statut"` |
| `"Rating"` | `"Mention"` |
| `"No evaluations found."` | `"Aucune évaluation trouvée."` |

### `hrms-frontend/src/pages/leaves/MyLeavesPage.tsx`
| Anglais | Français |
|---------|----------|
| `"My Leaves"` | `"Mes congés"` |
| `"+ New Request"` | `"+ Nouvelle demande"` |
| `"Loading..."` | `"Chargement..."` |
| `"From"` | `"Du"` |
| `"To"` | `"Au"` |
| `"Days"` | `"Jours"` |
| `"No leave requests yet."` | `"Aucune demande de congé pour le moment."` |
| `"of X days"` | `"sur X jours"` |

---

## B. Corriger l'affichage des employés (0 membres par département)
**Fichier :** `hrms-frontend/src/pages/employees/EmployeeListPage.tsx`

Le backend a été corrigé (serializer + `department_id`) mais le frontend affiche toujours "0 membres". Le serveur Django doit être redémarré pour que les corrections prennent effet.

**Action :** Redémarrer le backend → vérifier `GET /api/v1/employees/?page_size=200` retourne `department_id` pour chaque employé.

---

## C. Corriger la page Rapports (4 liens cassés → 404)
**Fichier :** `hrms-frontend/src/pages/reports/ReportsPage.tsx`

Les 4 cartes pointent vers des routes inexistantes :
- `/reports/attendance` → 404
- `/reports/leaves` → 404
- `/reports/salary` → 404
- `/reports/performance` → 404

**Solution recommandée :** Remplacer les 4 cartes par des statistiques réelles directement dans la page (congés par mois, présences par département, bulletins générés, scores d'évaluation).

---

## D. Page AI Insights — tout en anglais
**Fichier :** `hrms-frontend/src/pages/ai/AIInsightsPage.tsx`

| Anglais | Français |
|---------|----------|
| `"Loading AI insights..."` | `"Chargement des analyses IA..."` |
| `"AI Insights & Analytics"` | `"Analyses & Intelligence Artificielle"` |
| `"Leave Forecast"` | `"Prévision des congés"` |
| `"X leaves"` | `"X congés"` |
| `"Not enough historical data for predictions."` | `"Données historiques insuffisantes."` |
| `"Late Arrival Patterns"` | `"Retards récurrents"` |
| `"No concerning patterns detected."` | `"Aucun comportement préoccupant détecté."` |
| `"Department Alerts"` | `"Alertes par département"` |
| `"No active alerts."` | `"Aucune alerte active."` |
| `"Recommendations"` | `"Recommandations"` |
| `"Priority:"` | `"Priorité :"` |
| `"Risk:"` | `"Risque :"` |
| `"No recommendations at this time."` | `"Aucune recommandation pour le moment."` |

---

# 🟡 AMÉLIORATIONS RECOMMANDÉES — PRIORITÉ MOYENNE

## E. Fiche détaillée d'un employé (clic sur une ligne)
**Fichier :** `hrms-frontend/src/pages/employees/EmployeeListPage.tsx`

Cliquer sur une ligne d'employé ne fait rien. Ajouter un panneau latéral ou modal avec :
- Informations personnelles complètes (CIN, date de naissance, adresse, contact d'urgence)
- Profil professeur : spécialisation, heures d'enseignement, publications
- Documents attachés
- Bouton "Modifier" pour éditer

---

## F. Formulaire de mission — champ UUID inutilisable
**Fichier :** `hrms-frontend/src/pages/missions/MissionListPage.tsx`

Le champ "ID Employé (UUID)" dans le formulaire d'ajout de mission demande un UUID brut. Remplacer par un menu déroulant avec la liste des employés (nom + matricule).

---

## G. Système de changement de langue (i18n) — FR / EN / AR
**Fichiers concernés :**
- `hrms-frontend/src/components/layout/Topbar.tsx` — ajouter le sélecteur de langue
- `hrms-frontend/src/i18n/` — créer les fichiers de traduction
- `hrms-frontend/src/main.tsx` — initialiser i18next

**Description :**
Ajouter dans la barre supérieure (Topbar) un sélecteur de langue avec 3 options :
- 🇫🇷 Français (langue par défaut)
- 🇬🇧 English
- 🇲🇦 العربية (avec direction RTL automatique)

Quand l'utilisateur choisit une langue, toute l'interface bascule dans cette langue immédiatement sans rechargement de page.

**Bibliothèque à utiliser :** `i18next` + `react-i18next` (déjà présentes dans `package.json` ✅)

**Fichiers de traduction à créer :**
- `src/i18n/fr.json` — textes en français
- `src/i18n/en.json` — textes en anglais
- `src/i18n/ar.json` — textes en arabe

**Comportement RTL pour l'arabe :**
Quand la langue arabe est sélectionnée, ajouter `dir="rtl"` sur le `<html>` et inverser la disposition de la Sidebar (droite au lieu de gauche).

---

## H. Bouton hamburger pour afficher/masquer la Sidebar
**Fichier :** `hrms-frontend/src/components/layout/AppLayout.tsx`

**Description :**
Ajouter un bouton (☰) dans la Topbar qui permet d'afficher et masquer la Sidebar sur **desktop et mobile**.

**Comportement actuel :**
- Sur mobile : la Sidebar se cache automatiquement ✅
- Sur desktop : la Sidebar est toujours visible, impossible de la masquer ❌

**Comportement souhaité :**
- Un clic sur le bouton ☰ masque la Sidebar → la zone de contenu s'élargit
- Un autre clic la réaffiche
- L'état est mémorisé pendant la session

---

## I. Ajouter la pagination aux grands tableaux
Les tableaux suivants chargent tout sans limite :
- `AuditLogPage.tsx` — peut contenir des milliers de lignes
- `AllRequestsPage.tsx` — peut contenir des centaines de demandes
- `SalaryListPage.tsx` — grandira avec le temps

---

# 🔵 RÉCAPITULATIF COMPLET

| # | Fichier | Problème | Priorité | Statut |
|---|---------|----------|----------|--------|
| A | `SalaryListPage.tsx` | Tout en anglais | 🔴 Haute | ✅ Fait |
| A | `EvaluationListPage.tsx` | Tout en anglais | 🔴 Haute | ✅ Fait |
| A | `MyLeavesPage.tsx` | Partiellement en anglais | 🔴 Haute | ✅ Fait |
| B | `EmployeeListPage.tsx` | 0 employés affichés | 🔴 Haute | ✅ Fait |
| C | `ReportsPage.tsx` | 4 liens cassés (404) | 🔴 Haute | ✅ Fait |
| D | `AIInsightsPage.tsx` | Tout en anglais | 🔴 Haute | ✅ Fait |
| E | `EmployeeListPage.tsx` | Pas de fiche détaillée au clic | 🟡 Moyenne | ✅ Fait |
| F | `MissionListPage.tsx` | Champ UUID inutilisable | 🟡 Moyenne | ✅ Fait |
| G | `Topbar.tsx` + `i18n/` | Système i18n FR/EN/AR + RTL | 🟡 Moyenne | ✅ Fait |
| H | `AppLayout.tsx` | Bouton hamburger desktop+mobile | 🟡 Moyenne | ✅ Fait |
| I | `AuditLogPage`, `AllRequestsPage`, `SalaryListPage` | Pas de pagination | 🟡 Moyenne | ✅ Fait |
