import os

EXCLUDED_DIRS = {"node_modules", ".git", ".next", ".turbo", "dist", "build"}
TEXT_EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.md', '.txt', '.py'}

def get_all_files(root_dir):
    result = []

    for foldername, _, filenames in os.walk(root_dir):
        if any(excluded in foldername for excluded in EXCLUDED_DIRS):
            continue

        for filename in filenames:
            filepath = os.path.join(foldername, filename)
            ext = os.path.splitext(filename)[1].lower()
            if ext in TEXT_EXTENSIONS:
                result.append(filepath)

    return result

def read_file_content(filepath):
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except:
        return ""

def export_balanced_parts(root_dir, output_base="code_part"):
    all_files = get_all_files(root_dir)

    # Lire tous les fichiers avec leur contenu
    file_entries = []
    for path in all_files:
        content = read_file_content(path)
        relative_path = os.path.relpath(path, root_dir)
        wrapped_content = f"\n\n# --- {relative_path} ---\n{content}\n"
        file_entries.append((relative_path, wrapped_content, len(wrapped_content)))

    # Trier les fichiers par taille (descendant)
    file_entries.sort(key=lambda x: x[2], reverse=True)

    part1, part2 = [], []
    size1, size2 = 0, 0

    for _, content, size in file_entries:
        if size1 <= size2:
            part1.append(content)
            size1 += size
        else:
            part2.append(content)
            size2 += size

    with open(f"{output_base}1.txt", "w", encoding="utf-8") as f1:
        f1.writelines(part1)

    with open(f"{output_base}2.txt", "w", encoding="utf-8") as f2:
        f2.writelines(part2)

    print(f"✅ Fichiers générés : {output_base}1.txt ({size1} car.), {output_base}2.txt ({size2} car.)")

if __name__ == "__main__":
    export_balanced_parts("./")
