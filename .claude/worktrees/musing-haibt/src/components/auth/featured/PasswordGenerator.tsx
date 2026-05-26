"use client";

import { useState } from "react";
import { RefreshCw, Copy, Check, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PasswordGeneratorProps {
  onSelectPassword: (password: string) => void;
}

export const PasswordGenerator = ({
  onSelectPassword,
}: PasswordGeneratorProps) => {
  const [passwordLength, setPasswordLength] = useState(12);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const generatePassword = () => {
    let charset = "";
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (includeNumbers) charset += "0123456789";
    if (includeSymbols) charset += "!@#$%^&*()_-+={}[]|:;<>,.?/~";

    // Ensure at least one character set is selected
    if (charset === "") {
      charset =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    }

    let password = "";
    for (let i = 0; i < passwordLength; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    setGeneratedPassword(password);
    return password;
  };

  const handleGenerateClick = () => {
    generatePassword();
    setCopied(false);
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUsePassword = () => {
    if (generatedPassword) {
      onSelectPassword(generatedPassword);
    }
  };

  return (
    <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-800">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
          Password Generator
        </h3>
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          {showOptions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {showOptions && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Password Length: {passwordLength}
            </label>
            <Input
              type="range"
              min="8"
              max="30"
              value={passwordLength}
              onChange={(e) => setPasswordLength(parseInt(e.target.value))}
              className="w-full mt-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <input
                id="uppercase"
                type="checkbox"
                checked={includeUppercase}
                onChange={() => setIncludeUppercase(!includeUppercase)}
                className="h-4 w-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded"
              />
              <label
                htmlFor="uppercase"
                className="ml-2 text-xs text-gray-700 dark:text-gray-300">
                Uppercase (A-Z)
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="lowercase"
                type="checkbox"
                checked={includeLowercase}
                onChange={() => setIncludeLowercase(!includeLowercase)}
                className="h-4 w-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded"
              />
              <label
                htmlFor="lowercase"
                className="ml-2 text-xs text-gray-700 dark:text-gray-300">
                Lowercase (a-z)
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="numbers"
                type="checkbox"
                checked={includeNumbers}
                onChange={() => setIncludeNumbers(!includeNumbers)}
                className="h-4 w-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded"
              />
              <label
                htmlFor="numbers"
                className="ml-2 text-xs text-gray-700 dark:text-gray-300">
                Numbers (0-9)
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="symbols"
                type="checkbox"
                checked={includeSymbols}
                onChange={() => setIncludeSymbols(!includeSymbols)}
                className="h-4 w-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded"
              />
              <label
                htmlFor="symbols"
                className="ml-2 text-xs text-gray-700 dark:text-gray-300">
                Symbols (!@#$)
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 flex space-x-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={generatedPassword}
            readOnly
            placeholder="Generate a password"
            className="w-full py-1 px-3 border border-gray-300 dark:border-gray-600 rounded text-sm 
            focus:outline-none focus:ring-1 focus:ring-blue-500 
            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          {generatedPassword && (
            <button
              onClick={handleCopyClick}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 
              dark:text-gray-400 dark:hover:text-gray-200">
              {copied ? (
                <Check
                  size={16}
                  className="text-green-500 dark:text-green-400"
                />
              ) : (
                <Copy size={16} />
              )}
            </button>
          )}
        </div>

        <Button
          onClick={handleGenerateClick}
          className="p-1 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700
          dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200">
          <RefreshCw size={18} />
        </Button>
      </div>

      {generatedPassword && (
        <button
          onClick={handleUsePassword}
          className="mt-2 w-full text-xs py-1 text-blue-600 hover:text-blue-800
          dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-center">
          Use this password
        </button>
      )}
    </div>
  );
};
