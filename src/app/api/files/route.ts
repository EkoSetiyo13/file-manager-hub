import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import levenshtein from "fast-levenshtein"; // Import Levenshtein
import dotenv from "dotenv";
dotenv.config();

const ROOT_DIR = path.join(process.env.DIRECTORY_PATH as string);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const currentPath = searchParams.get("path") || "";
  const searchQuery = searchParams.get("search") || "";
  const action = searchParams.get("action") || "list";

  try {
    const fullPath = path.join(ROOT_DIR, currentPath);

    // Validasi path untuk mencegah akses di luar ROOT_DIR
    if (!fullPath.startsWith(ROOT_DIR)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    // Periksa apakah file/direktori ada
    let pathExists = true;
    try {
      await fs.access(fullPath);
    } catch {
      pathExists = false;
    }
    console.log("pathExists", searchQuery);
    if (!pathExists && !searchQuery) {
      return NextResponse.json(
        { error: "File atau direktori tidak ditemukan" },
        { status: 404 }
      );
    }

    switch (action) {
      case "list":
        return handleList(fullPath, currentPath, searchQuery);
      case "preview":
        return handlePreview(fullPath);
      case "download":
        return handleDownload(fullPath);
      default:
        return NextResponse.json(
          { error: "Aksi tidak valid" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

async function handleList(
  fullPath: string,
  currentPath: string,
  searchQuery: string
) {
  let files = [];

  // Use a case-insensitive approach for search
  const searchQueryLower = searchQuery.toLowerCase();

  if (searchQuery) {
    const allFiles = await getAllFiles(ROOT_DIR); // Get all files in the root directory

    // Implement fuzzy search with Levenshtein distance and substring match
    const searchResults = allFiles.filter((file) => {
      const fileNameLower = file.name.toLowerCase();
      const distance = levenshtein.get(fileNameLower, searchQueryLower);

      // Check if the search query is a substring of the file name or if the Levenshtein distance is small
      return fileNameLower.includes(searchQueryLower) || distance <= 2;
    });

    files = searchResults;
  } else if (await directoryExists(fullPath)) {
    const dirents = await fs.readdir(fullPath, { withFileTypes: true });
    files = await Promise.all(
      dirents.map(async (dirent) => {
        const filePath = path.join(fullPath, dirent.name);
        const stats = await fs.stat(filePath);
        return {
          name: dirent.name,
          isDirectory: dirent.isDirectory(),
          path: path.join(currentPath, dirent.name),
          created: stats.birthtime, // File creation time
          size: dirent.isDirectory() ? null : stats.size, // File size or null for directories
        };
      })
    );
  } else {
    return NextResponse.json(
      { message: "Tidak ada hasil yang ditemukan", files: [], currentPath },
      { status: 200 }
    );
  }

  // If search results are empty
  if (files.length === 0) {
    return NextResponse.json(
      { message: "Tidak ada hasil yang ditemukan", files: [], currentPath },
      { status: 200 }
    );
  }

  return NextResponse.json({ files, currentPath });
}

async function directoryExists(fullPath: string) {
  try {
    const stat = await fs.stat(fullPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function handlePreview(fullPath: string) {
  const fileContent = await fs.readFile(fullPath);
  return new NextResponse(fileContent, {
    headers: {
      "Content-Type": "application/pdf",
    },
  });
}

async function handleDownload(fullPath: string) {
  const fileContent = await fs.readFile(fullPath);
  const fileName = path.basename(fullPath);
  return new NextResponse(fileContent, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

// Fungsi rekursif untuk mendapatkan semua file
async function getAllFiles(
  dir: string
): Promise<{ name: string; isDirectory: boolean; path: string }[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map(async (dirent) => {
      const res = path.resolve(dir, dirent.name);
      if (dirent.isDirectory()) {
        return getAllFiles(res);
      } else {
        return [
          {
            name: dirent.name,
            isDirectory: false,
            path: path.relative(ROOT_DIR, res),
          },
        ];
      }
    })
  );
  return files.flat();
}
