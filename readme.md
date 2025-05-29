# Wo man was findet
# Entwicklung im code
Das lokale starten erfolgt mittels:
`hugo server`

## Beispiel: Hinzufügen eines Menüpunktes in der Topnavigation
Es soll ein icon für Speiseplan hinzugefügt werde.
Das wird in der Datei `config/_default/menus.de.toml` gemacht indem folgendes hinzugefügt wird:

``` toml
[[top]]
name = "SPEISEPLAN"
pageRef = "/pages/speiseplan"
weight = 4
[[top.params]]
icon = "fa fa-utensils"
```

die icons können über die Seite `https://fontawesome.com/search` gesucht werden und dessen name mit einem präfix `fa-` genutzt werden. Der Link kann auch extern sein. Dafür muss jedoch `pageRef` zu `url` umbenannt werden. Hier muss noch die md Datei `speiseplan.md` im Ordner `content/de/pages` angelegt werden.


## Socialmedia links unten auf der Seite entfernen

Entweder über die admin Oberfläche unter den Site Settings -> social media oder die Datei `data/social.json` bearbeiten.
