"use client";

import { Suspense, useEffect, useState, ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { HiFolder, HiDocument, HiSearch, HiViewGrid, HiViewList } from "react-icons/hi";

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

// Custom Tooltip component (unchanged)
const Tooltip = ({ content, children }: { content: string; children: ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute z-10 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm tooltip dark:bg-gray-700 -top-10 left-1/2 transform -translate-x-1/2">
          {content}
          <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
      )}
    </div>
  );
};

function FileList({ path, search }: { path: string; search: string }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [folderCount, setFolderCount] = useState<number>(0);
  const [fileCount, setFileCount] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const router = useRouter();

  useEffect(() => {
    const fetchFiles = async () => {
      const res = await fetch(`/api/files?path=${encodeURIComponent(path)}&search=${encodeURIComponent(search)}`);
      const data: FileListResponse = await res.json();
      setFiles(data.files);
      setCurrentPath(data.currentPath);
      
      // Count folders and files
      const folders = data.files.filter(item => item.isDirectory);
      const filesOnly = data.files.filter(item => !item.isDirectory);
      setFolderCount(folders.length);
      setFileCount(filesOnly.length);
    };

    fetchFiles();
  }, [path, search]);

  const handleOpen = (filePath: string) => {
    router.push(`/?path=${encodeURIComponent(filePath)}`);
  };

  const truncateName = (name: string, maxLength: number) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  return (
    <>
      {/* Current Path, Counts, and View Toggle */}
      <div className="mb-4 flex justify-between items-center">
        <div className="space-y-2">
          <div>
            <span className="font-medium text-gray-600">Current Path:</span>{" "}
            <span className="text-gray-800">{currentPath || "/"}</span>
          </div>
          <div className="flex space-x-4">
            <div>
              <span className="font-medium text-gray-600">Folders:</span>{" "}
              <span className="text-gray-800">{folderCount}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Files:</span>{" "}
              <span className="text-gray-800">{fileCount}</span>
            </div>
          </div>
        </div>
        <button
          onClick={toggleViewMode}
          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300"
        >
          {viewMode === 'grid' ? (
            <>
              <HiViewList className="w-5 h-5" />
              <span>List View</span>
            </>
          ) : (
            <>
              <HiViewGrid className="w-5 h-5" />
              <span>Grid View</span>
            </>
          )}
        </button>
      </div>

      {/* File List */}
      <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6" : "space-y-4"}>
        {files.length > 0 ? (
          files.map((file) => (
            <div
              key={file.name}
              className={`group bg-white shadow-lg rounded-md p-4 ${
                viewMode === 'grid'
                  ? 'flex flex-col justify-between hover:bg-gray-50 transition-transform duration-300 transform hover:-translate-y-1'
                  : 'flex items-center justify-between hover:bg-gray-50'
              }`}
            >
              <div className={`flex items-center ${viewMode === 'list' ? 'flex-1' : ''}`}>
                {file.isDirectory ? (
                  <HiFolder className="text-yellow-400 text-4xl mr-4 flex-shrink-0" />
                ) : (
                  <HiDocument className="text-blue-400 text-4xl mr-4 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <Tooltip content={file.name}>
                    <h3 className="text-lg font-medium text-gray-700 truncate">
                      {truncateName(file.name, viewMode === 'grid' ? 20 : 40)}
                    </h3>
                  </Tooltip>
                  {file.isDirectory && (
                    <p className="text-sm text-gray-500">Folder</p>
                  )}
                  {!file.isDirectory && viewMode === 'list' && (
                    <p className="text-sm text-gray-500">
                      {file.size ? `${(file.size / 1024).toFixed(2)} KB` : "N/A"} | {new Date(file.created).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {viewMode === 'grid' && !file.isDirectory && (
                <div className="pt-2">
                  <p className="text-sm text-gray-500">
                    {file.size ? `${(file.size / 1024).toFixed(2)} KB` : "N/A"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(file.created).toLocaleString()}
                  </p>
                </div>
              )}

              <div className={`flex ${viewMode === 'grid' ? 'justify-between mt-4' : 'ml-4'}`}>
                {file.isDirectory ? (
                  <button
                    onClick={() => handleOpen(file.path)}
                    className="text-blue-500 hover:underline"
                  >
                    Open
                  </button>
                ) : (
                  <div className="flex space-x-4">
                    <Link
                      href={`/api/files?path=${encodeURIComponent(file.path)}&action=preview`}
                      target="_blank"
                      className="text-blue-500 hover:underline"
                    >
                      Preview
                    </Link>
                    <Link
                      href={`/api/files?path=${encodeURIComponent(file.path)}&action=download`}
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
            No files found.
          </div>
        )}
      </div>
    </>
  );
}

function SearchForm({ initialSearch }: { initialSearch: string }) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const router = useRouter();

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const path = new URLSearchParams(window.location.search).get("path") || "";
    router.push(
      `?path=${encodeURIComponent(path)}&search=${encodeURIComponent(searchQuery)}`
    );
  };

  return (
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
  );
}

function FileManagerContent() {
  const searchParams = useSearchParams();
  const path = searchParams?.get("path") || "";
  const search = searchParams?.get("search") || "";

  return (
    <>
      <SearchForm initialSearch={search} />
      <FileList path={path} search={search} />
    </>
  );
}

const FilesPage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto px-6 py-8">
        <div className="bg-white shadow-md rounded-md p-6">
          <h1 className="text-3xl font-semibold text-gray-700 mb-6">
            File Manager Hub
          </h1>
          <Suspense fallback={<div>Loading...</div>}>
            <FileManagerContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default FilesPage;