#!/usr/bin/env python3
"""
Script pour générer les icônes de l'extension Subtitle Downloader
Nécessite Pillow: pip install Pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Erreur: Pillow n'est pas installé")
    print("Installez-le avec: pip install Pillow")
    exit(1)

def create_icon(size):
    """Crée une icône simple pour l'extension"""
    # Créer une image avec fond dégradé
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)

    # Fond avec dégradé simulé (couleur violette)
    for i in range(size):
        color_value = int(102 + (118 - 102) * (i / size))  # Dégradé de #667eea à #764ba2
        draw.rectangle([(0, i), (size, i+1)], fill=(color_value, 126, 234))

    # Dessiner un rectangle représentant un sous-titre
    margin = size // 6
    rect_height = size // 4
    rect_y = size - margin - rect_height

    # Rectangle blanc (sous-titre)
    draw.rectangle(
        [(margin, rect_y), (size - margin, size - margin)],
        fill='white',
        outline='white',
        width=2
    )

    # Lignes de texte simulées
    line_margin = margin + size // 20
    line_height = size // 30
    line_spacing = size // 25

    if size >= 48:
        # Première ligne
        draw.rectangle(
            [(line_margin, rect_y + line_spacing),
             (size - line_margin, rect_y + line_spacing + line_height)],
            fill=(102, 126, 234)
        )

        # Deuxième ligne (plus courte)
        draw.rectangle(
            [(line_margin, rect_y + line_spacing * 2 + line_height),
             (size - line_margin - size // 8, rect_y + line_spacing * 2 + line_height * 2)],
            fill=(102, 126, 234)
        )

    # Icône de téléchargement (flèche vers le bas)
    if size >= 48:
        arrow_size = size // 5
        arrow_x = size // 2
        arrow_y = size // 3
        arrow_width = size // 20

        # Trait vertical
        draw.rectangle(
            [(arrow_x - arrow_width, arrow_y - arrow_size),
             (arrow_x + arrow_width, arrow_y)],
            fill='white'
        )

        # Pointe de la flèche
        points = [
            (arrow_x, arrow_y + arrow_width * 2),  # Pointe
            (arrow_x - arrow_size // 2, arrow_y - arrow_width),  # Gauche
            (arrow_x + arrow_size // 2, arrow_y - arrow_width)   # Droite
        ]
        draw.polygon(points, fill='white')

    return img

def main():
    """Génère les trois tailles d'icônes requises"""
    sizes = [16, 48, 128]

    print("Génération des icônes pour Subtitle Downloader...")

    for size in sizes:
        filename = f"icon{size}.png"
        print(f"Création de {filename}...")

        icon = create_icon(size)
        icon.save(filename, 'PNG')

        print(f"✓ {filename} créé avec succès ({size}x{size})")

    print("\nToutes les icônes ont été générées avec succès!")
    print("Vous pouvez maintenant charger l'extension dans Chrome.")

if __name__ == "__main__":
    main()
