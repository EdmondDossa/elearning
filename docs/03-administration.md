# 3. Administration des formations et des médias

## Organisation du contenu

Une **formation** décrit le sujet : titre, formateur, langue d’origine, niveau
et description. Elle contient plusieurs **modules**, ajoutés dans l’ordre du
programme. Chaque module contient :

- un titre, une description optionnelle et une durée en secondes (1 à 36 000) ;
- une vidéo `.mp4`, prévue sans son ;
- au moins une piste audio séparée, avec une langue et une piste marquée **VO** ;
- des sous-titres `.vtt` optionnels, associés à leur langue.

La vidéo et les pistes audio doivent être synchronisées. L’application ne génère
ni traduction, ni doublage, ni transcription. Une vidéo contenant du son ne
remplace pas la piste audio séparée attendue par ce parcours.

## Préparer les fichiers

L’interface liste les fichiers présents directement dans `backend/media`, sans
parcourir les sous-dossiers. Les noms doivent utiliser des lettres ASCII,
chiffres, tirets, underscores et points, sans espaces ni accents.

| Contenu | Extensions proposées dans l’administration |
| --- | --- |
| Vidéo | `.mp4` |
| Audio | `.m4a`, `.mp3`, `.aac`, `.ogg` |
| Sous-titres | `.vtt` (WebVTT) |

Utiliser des extensions en minuscules. Exemple pour un module :

```text
backend/media/
  introduction.mp4
  introduction.fr.m4a
  introduction.en.m4a
  introduction.fr.vtt
  introduction.en.vtt
```

Le bouton **Associer les pistes automatiquement** recherche les fichiers
`<nom-video>.<langue>.m4a` et `<nom-video>.<langue>.vtt`. Les langues proposées
actuellement sont `fr`, `en` et `es`. Les autres formats audio doivent être
sélectionnés manuellement. Cette action remplace les associations du formulaire ;
vérifier la piste VO avant d’enregistrer, car la première piste trouvée est
sélectionnée automatiquement.

Pour générer les médias de démonstration, installer `ffmpeg` et `espeak-ng`,
puis exécuter depuis la racine :

```bash
bash backend/scripts/generate-media.sh
```

Ce script produit les fichiers `c1m1`, etc., utilisés par les données de
démonstration, et remplace les fichiers portant ces mêmes noms.

## Rendre les médias disponibles avec Docker

Le Dockerfile du backend copie `backend/media` dans l’image. La configuration
Compose actuelle ne monte pas de volume pour ces médias. Après un ajout de
fichiers sur la machine hôte, reconstruire et recréer le backend :

```bash
docker compose up -d --build backend
```

Puis recharger la page d’administration. Ajouter un fichier uniquement dans un
conteneur en cours d’exécution ne garantit pas sa conservation à la recréation.
Les fichiers sont exposés sous `/media/<nom-du-fichier>`.

## Créer la formation et ses modules

1. Se connecter avec un compte `ADMIN`, puis ouvrir `/admin`.
2. Créer une formation avec ses informations générales. L’application ouvre
   ensuite sa page de gestion.
3. Ajouter un module : renseigner le titre, la durée réelle et la vidéo.
4. Associer les pistes automatiquement ou choisir les fichiers audio et
   sous-titres dans les listes.
5. Vérifier les langues et sélectionner exactement une piste audio **VO**.
6. Enregistrer le module et répéter pour les suivants.
7. Vérifier le parcours apprenant : inscription à la formation, lecture,
   changement de langue, sous-titres et reprise de progression.

Une seule piste audio et un seul fichier de sous-titres sont autorisés par langue,
avec au maximum dix pistes de chaque catégorie par module. Les sous-titres sont
facultatifs. Les modules sont ajoutés en fin de programme ; leur suppression
renumérote les suivants.

La suppression d’une formation supprime aussi ses modules, inscriptions et
progressions. La suppression des enregistrements ne supprime pas les fichiers
physiques de la médiathèque.

## Périmètre retenu pour l’exercice

L’énoncé demande la lecture du contenu et le choix entre plusieurs pistes audio,
et autorise un doublage simulé. Les sous-titres et la gestion des formations côté
administrateur sont des bonus. L’import de médias depuis le navigateur n’est
pas demandé et ne fait pas partie du périmètre retenu.

L’administration associe donc les modules à des fichiers préchargés. La
conversion des médias, l’extraction automatique du son et la génération des
sous-titres sont également hors périmètre. Il n’existe pas de statut
brouillon/publication : une formation créée entre dans le catalogue.
