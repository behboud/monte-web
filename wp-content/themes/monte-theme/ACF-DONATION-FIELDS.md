# ACF Field Configuration for Donation Pages

## Required ACF Fields for single-donation.php Template

The donation template (single-donation.php) requires specific Advanced Custom Fields to display content properly.

### Field Group: Donation Fields
- **Field Group Name:** Donation Fields
- **Location:** Post Type is equal to Donation

### Fields:

#### 1. Calligraphy Heading (uberschrift)
- **Field Label:** Überschrift
- **Field Name:** uberschrift
- **Field Type:** Text
- **Required:** No
- **Description:** Large calligraphy-style heading displayed at top of page

#### 2. Donation Items (spenden)
- **Field Label:** Spenden Items
- **Field Name:** spenden
- **Field Type:** Repeater
- **Required:** No
- **Layout:** Block
- **Button Label:** Add Donation Item

**Sub-fields:**

##### 2a. Image
- **Field Label:** Image
- **Field Name:** image
- **Field Type:** Image
- **Return Format:** Array (or URL)
- **Preview Size:** Medium
- **Library:** All

##### 2b. Title
- **Field Label:** Title
- **Field Name:** title
- **Field Type:** Text
- **Required:** No

##### 2c. Content
- **Field Label:** Content
- **Field Name:** content
- **Field Type:** Textarea
- **Required:** No
- **Rows:** 4

## Template Structure

The template displays:
1. Page header with breadcrumb navigation
2. Calligraphy heading (uberschrift field) - centered, large italic text
3. Repeater items in flex layout:
   - Image on left (1/3 width)
   - Title and content on right (2/3 width)

## Example Usage

See: /content/de/spenden/foerderer.md for content structure reference

## Migration Notes

When migrating content from Hugo to WordPress:
- Hugo frontmatter field `uberschrift` → ACF field `uberschrift`
- Hugo frontmatter array `spenden` → ACF repeater `spenden`
- Each item needs: title, image path, content
