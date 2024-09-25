"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { HiFolder, HiDocument, HiSearch } from "react-icons/hi";

interface FileItem {
  name: string;
  isDirectory: boolean;
  path: string;
  size: number;
  created: string;
}

interface FileListResponse {
  files: FileItem[];
  currentPath: string;
}

const FilesPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const path = searchParams.get("path") || "";
    const search = searchParams.get("search") || "";

    // Set the search query state based on URL parameters
    setSearchQuery(search);

    const fetchFiles = async () => {
      const res = await fetch(`/api/files?path=${path}&search=${search}`);
      const data: FileListResponse = await res.json();
      setFiles(data.files);
      setCurrentPath(data.currentPath);
    };

    fetchFiles();
  }, [searchParams]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    router.push(
      `?path=${currentPath}&search=${encodeURIComponent(searchQuery)}`
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto px-6 py-8">
        <div className="bg-white shadow-md rounded-md p-6">
          <h1 className="text-3xl font-semibold text-gray-700 mb-6">
            File Manager Hub
          </h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6 flex items-center">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full border border-gray-300 rounded-md py-2 px-4 pl-10 focus:outline-none focus:border-blue-500"
              />
              <HiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
            <button
              type="submit"
              className="ml-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300"
            >
              Search
            </button>
          </form>

          {/* Current Path */}
          <div className="mb-4">
            <span className="font-medium text-gray-600">Current Path:</span>{" "}
            <span className="text-gray-800">{currentPath || "/"}</span>
          </div>

          {/* File List */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {files.length > 0 ? (
              files.map((file) => (
                <div
                  key={file.name}
                  className="group bg-white shadow-lg rounded-md p-4 flex flex-col justify-between hover:bg-gray-50 transition-transform duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-center">
                    {file.isDirectory ? (
                      <HiFolder className="text-yellow-400 text-4xl mr-4" />
                    ) : (
                      <HiDocument className="text-blue-400 text-4xl mr-4" />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-700 truncate">
                        {file.name}
                      </h3>
                      {file.isDirectory && (
                        <p className="text-sm text-gray-500">Folder</p>
                      )}
                      {!file.isDirectory && (
                        <div className="pt-2">
                          <p className="text-sm text-gray-500">
                            {file.size
                              ? `${(file.size  / 1024).toFixed(2)} KB`
                              : "N/A"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(file.created).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between mt-4">
                    {file.isDirectory ? (
                      <Link
                        href={`/?path=${encodeURIComponent(file.path)}`}
                        className="text-blue-500 hover:underline"
                      >
                        Open
                      </Link>
                    ) : (
                      <div className="flex space-x-4">
                        <Link
                          href={`/api/files?path=${encodeURIComponent(
                            file.path
                          )}&action=preview`}
                          target="_blank"
                          className="text-blue-500 hover:underline"
                        >
                          Preview
                        </Link>
                        <Link
                          href={`/api/files?path=${encodeURIComponent(
                            file.path
                          )}&action=download`}
                          className="text-green-500 hover:underline"
                        >
                          Download
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500">
                Tidak ada file yang ditemukan.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilesPage;
