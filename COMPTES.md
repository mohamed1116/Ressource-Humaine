# Comptes Utilisateurs - SGRH FPT

---

## Super Admin
| Nom | Email | Mot de passe |
|-----|-------|--------------|
| Super Admin | *(créé via `python manage.py create_superadmin`)* | *(défini à la création)* |

---

## Admin / HR
| Nom | Email | Mot de passe |
|-----|-------|--------------|
| Admin HR | admin@fpt.ac.ma | admin123456 |
| Fatima TAHIRI | rh@fpt.ac.ma | staff123456 |

---

## Department Head
| Nom | Email | Mot de passe | Département |
|-----|-------|--------------|-------------|
| Youssef ES-SAADY | y.essaady@uiz.ma | prof123456 | Mathématiques et Informatique |
| Zine Elabidine EL MORJANI | z.elmorjani@fpt.ac.ma | prof123456 | Sciences et Techniques |
| Khalid BENAMARA | k.benamara@fpt.ac.ma | prof123456 | Sciences Économiques et Gestion |
| Ahmed BEN HADDOU | a.benhaddou@fpt.ac.ma | prof123456 | Sciences Humaines et Sociales |

---

## Professors - Mathématiques et Informatique (INFO)
| Nom | Email | Mot de passe | Grade |
|-----|-------|--------------|-------|
| Youssef ES-SAADY | y.essaady@uiz.ma | prof123456 | PES |
| Sara ROUBI | s.roubi@fpt.ac.ma | prof123456 | PA |
| Abderrahmane SADIQ | a.sadiq@fpt.ac.ma | prof123456 | PH |
| Lotfi NAJDI | l.najdi@uiz.ac.ma | prof123456 | PA |
| Maryem AIT EL HADJ | m.aitelhadj@fpt.ac.ma | prof123456 | PA |
| Hassan BOUZIANE | h.bouziane@fpt.ac.ma | prof123456 | PH |
| Khalid KHAYYA | k.khayya@fpt.ac.ma | prof123456 | PA |
| Fatima BENALI | f.benali@fpt.ac.ma | prof123456 | PA |

---

## Professors - Sciences et Techniques (ST)
| Nom | Email | Mot de passe | Grade |
|-----|-------|--------------|-------|
| Mohamed IGUERNANE | m.iguernane@fpt.ac.ma | prof123456 | PES |
| Zine Elabidine EL MORJANI | z.elmorjani@fpt.ac.ma | prof123456 | PES |
| Fouad LOTFI | f.lotfi@fpt.ac.ma | prof123456 | PES |
| Abdellatif ELHAMMADI | a.elhammadi@fpt.ac.ma | prof123456 | PES |
| Said GHARBY | s.gharby@fpt.ac.ma | prof123456 | PH |
| Noureddine EL BARAKA | n.elbaraka@fpt.ac.ma | prof123456 | PA |
| Rachid AIT BRAHIM | r.aitbrahim@fpt.ac.ma | prof123456 | PH |
| Houda OUALI | h.ouali@fpt.ac.ma | prof123456 | PA |

---

## Professors - Sciences Économiques et Gestion (SEG)
| Nom | Email | Mot de passe | Grade |
|-----|-------|--------------|-------|
| Mustapha JAAD | m.jaad@fpt.ac.ma | prof123456 | PH |
| Noureddine AIT ERRAYSS | n.aiterrayss@fpt.ac.ma | prof123456 | PH |
| Khalid BENAMARA | k.benamara@fpt.ac.ma | prof123456 | PES |
| Samir OULHAJ | s.oulhaj@fpt.ac.ma | prof123456 | PA |
| Naima BEN MOUSSA | n.benmoussa@fpt.ac.ma | prof123456 | PA |
| Abdelkrim EL GHARBI | a.elgharbi@fpt.ac.ma | prof123456 | PH |

---

## Professors - Sciences Humaines et Sociales (SHS)
| Nom | Email | Mot de passe | Grade |
|-----|-------|--------------|-------|
| Azeddine ELMANSSOURI | a.elmanssouri@fpt.ac.ma | prof123456 | PA |
| Marwane SABIR | m.sabir@fpt.ac.ma | prof123456 | PA |
| Nadia KROUDO | n.kroudo@fpt.ac.ma | prof123456 | PA |
| Mohammed EL HARTI | m.elharti@fpt.ac.ma | prof123456 | PH |
| Fatima ZOUINE | f.zouine@fpt.ac.ma | prof123456 | PA |
| Ahmed BEN HADDOU | a.benhaddou@fpt.ac.ma | prof123456 | PES |
| Laila AIT TALEB | l.aittaleb@fpt.ac.ma | prof123456 | PA |
| Omar BENKIRANE | o.benkirane@fpt.ac.ma | prof123456 | PH |

---

## Administrative Staff
| Nom | Email | Mot de passe | Rôle |
|-----|-------|--------------|------|
| Fatima TAHIRI | rh@fpt.ac.ma | staff123456 | Admin HR |
| Ahmed TAZI | scolarite@fpt.ac.ma | staff123456 | Staff |
| Khadija AMRANI | comptable@fpt.ac.ma | staff123456 | Staff |
| Youssef LAHLOU | biblio@fpt.ac.ma | staff123456 | Staff |

---

## 🚀 Initialisation de la base de données

```bash
# 1. Créer le Super Admin
python manage.py create_superadmin

# 2. Charger toutes les données FPT (professeurs, départements, templates...)
python manage.py seed_fpt_data
```

---

## 🌐 API Base URL
```
http://localhost:8000/api/v1/
```
