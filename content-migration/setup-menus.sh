#!/bin/bash

# WordPress Menu Setup Script for Monte Montessori
# Creates Top Menu, Main Menu, and Footer Menu based on Hugo menus.de.toml

set -e

WP="docker-compose exec -T wordpress wp --allow-root"

echo "🔗 Setting up WordPress menus for Monte Montessori..."

# Check if menus already exist and delete them if they do
echo "Checking for existing menus..."
EXISTING_TOP_MENU=$($WP menu list --format=csv | grep "top-menu" || echo "")
EXISTING_MAIN_MENU=$($WP menu list --format=csv | grep "main-menu" || echo "")
EXISTING_FOOTER_MENU=$($WP menu list --format=csv | grep "footer-menu" || echo "")

if [ ! -z "$EXISTING_TOP_MENU" ]; then
    echo "Deleting existing Top Menu..."
    $WP menu delete top-menu || true
fi

if [ ! -z "$EXISTING_MAIN_MENU" ]; then
    echo "Deleting existing Main Menu..."
    $WP menu delete main-menu || true
fi

if [ ! -z "$EXISTING_FOOTER_MENU" ]; then
    echo "Deleting existing Footer Menu..."
    $WP menu delete footer-menu || true
fi

# ==================== CREATE MENUS ====================
echo "Creating menu structures..."
$WP menu create "top-menu"
$WP menu create "main-menu"
$WP menu create "footer-menu"

# Assign menus to theme locations
echo "Assigning menus to locations..."
$WP menu location assign top-menu top-menu
$WP menu location assign main-menu main-menu
$WP menu location assign footer-menu footer-menu

# ==================== TOP MENU ====================
echo "Building Top Menu..."

# NEWS
$WP menu item add-custom top-menu "NEWS" "/aktuelles/" \
    --description="" \
    --classes="menu-item-top"

# KONTAKT
$WP menu item add-custom top-menu "KONTAKT" "/pages/kontakt/" \
    --description="" \
    --classes="menu-item-top"

# SPENDEN
$WP menu item add-custom top-menu "SPENDEN" "/spenden/spenden/" \
    --description="" \
    --classes="menu-item-top"

# SPEISEPLAN
$WP menu item add-custom top-menu "SPEISEPLAN" "/pages/speiseplan/" \
    --description="fa fa-utensils" \
    --classes="menu-item-top"

# ELTERN-LOGIN (external)
$WP menu item add-custom top-menu "ELTERN-LOGIN" "https://www.montessorischule-gilching.de/login" \
    --description="fa fa-user-lock" \
    --classes="menu-item-top" \
    --target="_blank"

echo "✅ Top Menu created with 5 items"

# ==================== MAIN MENU ====================
echo "Building Main Menu..."

# Startseite
$WP menu item add-custom main-menu "Startseite" "/" \
    --classes="menu-item-main"

# Unsere Schule (parent)
UNSERE_SCHULE=$($WP menu item add-custom main-menu "Unsere Schule" "#" \
    --classes="menu-item-main" \
    --porcelain)
echo "Created: Unsere Schule (ID: $UNSERE_SCHULE)"

# Unsere Schule > Konzept (parent)
KONZEPT=$($WP menu item add-custom main-menu "Konzept" "#" \
    --parent-id=$UNSERE_SCHULE \
    --classes="menu-item-sub" \
    --porcelain)
echo "Created: Konzept (ID: $KONZEPT)"

# Unsere Schule > Konzept > Qualitäten
$WP menu item add-custom main-menu "Qualitäten" "/schule/konzept/qualitaeten/" \
    --parent-id=$KONZEPT \
    --classes="menu-item-sub"

# Unsere Schule > Konzept > Maria Montessori (parent)
MARIA=$($WP menu item add-custom main-menu "Maria Montessori" "#" \
    --parent-id=$KONZEPT \
    --classes="menu-item-sub" \
    --porcelain)
echo "Created: Maria Montessori (ID: $MARIA)"

# Unsere Schule > Konzept > Maria Montessori > Zur Person
$WP menu item add-custom main-menu "Zur Person" "/schule/konzept/maria-montessori/zur-person/" \
    --parent-id=$MARIA \
    --classes="menu-item-sub"

# Unsere Schule > Konzept > Maria Montessori > Grundzüge der Pädagogik
$WP menu item add-custom main-menu "Grundzüge der Pädagogik" "/schule/konzept/maria-montessori/grundzuege-der-paedagogik/" \
    --parent-id=$MARIA \
    --classes="menu-item-sub"

# Unsere Schule > Schulhaus (parent)
SCHULHAUS=$($WP menu item add-custom main-menu "Schulhaus" "#" \
    --parent-id=$UNSERE_SCHULE \
    --classes="menu-item-sub" \
    --porcelain)
echo "Created: Schulhaus (ID: $SCHULHAUS)"

# Unsere Schule > Schulhaus > Haus
$WP menu item add-custom main-menu "Haus" "/schule/schulhaus/haus/" \
    --parent-id=$SCHULHAUS \
    --classes="menu-item-sub"

# Unsere Schule > Schulhaus > Küche
$WP menu item add-custom main-menu "Küche" "/schule/schulhaus/kueche/" \
    --parent-id=$SCHULHAUS \
    --classes="menu-item-sub"

# Unsere Schule > Schulhaus > Schulgeld
$WP menu item add-custom main-menu "Schulgeld" "/schule/schulhaus/schulgeld/" \
    --parent-id=$SCHULHAUS \
    --classes="menu-item-sub"

# Unsere Schule > Schulhaus > Schulordnung
$WP menu item add-custom main-menu "Schulordnung" "/schule/schulhaus/schulordnung/" \
    --parent-id=$SCHULHAUS \
    --classes="menu-item-sub"

# Unsere Schule > Verwaltung
$WP menu item add-custom main-menu "Verwaltung" "/schule/verwaltung/" \
    --parent-id=$UNSERE_SCHULE \
    --classes="menu-item-sub"

# Unsere Schule > Pädagogisches Team
$WP menu item add-custom main-menu "Pädagogisches Team" "/schule/paedagogisches-team/" \
    --parent-id=$UNSERE_SCHULE \
    --classes="menu-item-sub"

# Unsere Schule > Schüler*innen
$WP menu item add-custom main-menu "Schüler*innen" "/schule/schuelerinnen/" \
    --parent-id=$UNSERE_SCHULE \
    --classes="menu-item-sub"

# Unsere Schule > Elternengagement (parent)
ELTERNENGAGEMENT=$($WP menu item add-custom main-menu "Elternengagement" "#" \
    --parent-id=$UNSERE_SCHULE \
    --classes="menu-item-sub" \
    --porcelain)
echo "Created: Elternengagement (ID: $ELTERNENGAGEMENT)"

# Unsere Schule > Elternengagement > Elternbeirat
$WP menu item add-custom main-menu "Elternbeirat" "/schule/elternengagement/elternbeirat/" \
    --parent-id=$ELTERNENGAGEMENT \
    --classes="menu-item-sub"

# Unsere Schule > Elternengagement > AGs und Dienste
$WP menu item add-custom main-menu "AGs und Dienste" "/schule/elternengagement/ags-und-dienste/" \
    --parent-id=$ELTERNENGAGEMENT \
    --classes="menu-item-sub"

# Aufnahme (parent)
AUFNAHME=$($WP menu item add-custom main-menu "Aufnahme" "#" \
    --classes="menu-item-main" \
    --porcelain)
echo "Created: Aufnahme (ID: $AUFNAHME)"

# Aufnahme > Anmeldeunterlagen
$WP menu item add-custom main-menu "Anmeldeunterlagen" "/aufnahme/anmeldeunterlagen/" \
    --parent-id=$AUFNAHME \
    --classes="menu-item-sub"

# Aufnahme > Schulgeld
$WP menu item add-custom main-menu "Schulgeld" "/aufnahme/schulgeld/" \
    --parent-id=$AUFNAHME \
    --classes="menu-item-sub"

# Spenden und Förderer (parent)
SPENDEN_FOERDERER=$($WP menu item add-custom main-menu "Spenden und Förderer" "#" \
    --classes="menu-item-main" \
    --porcelain)
echo "Created: Spenden und Förderer (ID: $SPENDEN_FOERDERER)"

# Spenden und Förderer > Förderer
$WP menu item add-custom main-menu "Förderer" "/spenden/foerderer/" \
    --parent-id=$SPENDEN_FOERDERER \
    --classes="menu-item-sub"

# Spenden und Förderer > Spenden
$WP menu item add-custom main-menu "Spenden" "/spenden/spenden/" \
    --parent-id=$SPENDEN_FOERDERER \
    --classes="menu-item-sub"

# Verein (parent)
VEREIN=$($WP menu item add-custom main-menu "Verein" "#" \
    --classes="menu-item-main" \
    --porcelain)
echo "Created: Verein (ID: $VEREIN)"

# Verein > Vorstand
$WP menu item add-custom main-menu "Vorstand" "/verein/vorstand/" \
    --parent-id=$VEREIN \
    --classes="menu-item-sub"

# Verein > Satzung
$WP menu item add-custom main-menu "Satzung" "/verein/satzung/" \
    --parent-id=$VEREIN \
    --classes="menu-item-sub"

# Karriere
$WP menu item add-custom main-menu "Karriere" "/pages/karriere/" \
    --classes="menu-item-main"

# Presse
$WP menu item add-custom main-menu "Presse" "/pages/presse/" \
    --classes="menu-item-main"

echo "✅ Main Menu created with hierarchical structure (3 levels deep)"

# ==================== FOOTER MENU ====================
echo "Building Footer Menu..."

# Impressum
$WP menu item add-custom footer-menu "Impressum" "/pages/impressum/" \
    --classes="menu-item-footer"

# Datenschutzerklärung
$WP menu item add-custom footer-menu "Datenschutzerklärung" "/pages/datenschutz/" \
    --classes="menu-item-footer"

# login (external)
$WP menu item add-custom footer-menu "login" "https://www.montessorischule-gilching.de/login" \
    --classes="menu-item-footer" \
    --target="_blank"

echo "✅ Footer Menu created with 3 items"

# ==================== VERIFICATION ====================
echo ""
echo "📋 Menu Summary:"
echo "=================="
$WP menu list
echo ""
echo "📍 Menu Locations:"
echo "=================="
$WP menu location list
echo ""
echo "🎯 Menu Items Count:"
echo "=================="
echo "Top Menu:"
$WP menu item list top-menu --format=count
echo "Main Menu:"
$WP menu item list main-menu --format=count
echo "Footer Menu:"
$WP menu item list footer-menu --format=count

echo ""
echo "✅ All menus created successfully!"
echo ""
echo "Next steps:"
echo "1. Visit http://localhost:8080/wp-admin/nav-menus.php to review menus"
echo "2. Check that all menu locations are assigned"
echo "3. Verify 3-level hierarchy in Main Menu"
echo "4. Test icons display (Font Awesome icons in descriptions)"
echo "5. Test mobile menu functionality"
