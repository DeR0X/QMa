import { useState } from 'react';
import { X, Eye, EyeOff, Check, AlertTriangle, Key, Lock, Shield, Zap, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL_V2 } from '../../config/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  staffNumber?: string;
}

interface PasswordValidation {
  hasMinLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  isValid: boolean;
}

export default function ChangePasswordModal({ isOpen, onClose, onSuccess, staffNumber }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password: string): PasswordValidation => {
    const hasMinLength = password.length >= 15;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
    
    return {
      hasMinLength,
      hasLowercase,
      hasUppercase,
      hasNumbers,
      hasSymbols,
      isValid: hasMinLength && hasLowercase && hasUppercase && hasNumbers && hasSymbols
    };
  };

  const generateStrongPassword = () => {
    const length = 15;
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let password = '';
    
    // Stelle sicher, dass mindestens ein Zeichen aus jeder Kategorie enthalten ist
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // Fülle den Rest mit zufälligen Zeichen aus allen Kategorien
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 4; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Mische das Passwort
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setNewPassword(password);
    setConfirmPassword(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Die neuen Passwörter stimmen nicht überein');
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      toast.error('Das neue Passwort erfüllt nicht alle Sicherheitsanforderungen');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL_V2}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staffNumber,
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to change password');
      }

      toast.success('Passwort erfolgreich geändert');
      handleClose();
      onSuccess?.();
    } catch (error) {
      toast.error('Fehler beim Ändern des Passworts. Überprüfen Sie Ihr aktuelles Passwort.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsLoading(false);
    onClose();
  };

  const newPasswordValidation = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={handleClose} />
        
        <div className="relative transform overflow-hidden rounded-xl bg-white dark:bg-[#1a1a1a] px-6 pb-6 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg">
                <Key className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Passwort ändern
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sichern Sie Ihr Konto mit einem starken Passwort
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Aktuelles Passwort */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Aktuelles Passwort
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="block w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="Ihr aktuelles Passwort"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Neues Passwort */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Neues Passwort
                </label>
                <button
                  type="button"
                  onClick={generateStrongPassword}
                  className="flex items-center text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Starkes Passwort generieren
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="block w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  placeholder="Ihr neues Passwort"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Passwort-Bestätigung */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Neues Passwort bestätigen
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`block w-full pr-10 pl-4 py-3 border rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    confirmPassword && !passwordsMatch
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
                      : confirmPassword && passwordsMatch
                      ? 'border-green-300 dark:border-green-600 focus:border-green-500 focus:ring-green-500'
                      : 'border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary'
                  }`}
                  placeholder="Passwort wiederholen"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                {confirmPassword && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    {passwordsMatch ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Passwort-Anforderungen */}
            {newPassword && (
              <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-primary" />
                  Passwort-Anforderungen
                </h4>
                <div className="space-y-2">
                  <div className={`flex items-center text-sm ${newPasswordValidation.hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                      <div className={`w-4 h-4 mr-2 rounded-full flex items-center justify-center ${newPasswordValidation.hasMinLength ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                    <Check className={`h-3 w-3 ${newPasswordValidation.hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                  </div>
                    Mindestens 15 Zeichen ({newPassword.length}/15)
                  </div>
                  <div className={`flex items-center text-sm ${newPasswordValidation.hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                      <div className={`w-4 h-4 mr-2 rounded-full flex items-center justify-center ${newPasswordValidation.hasLowercase ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                    <Check className={`h-3 w-3 ${newPasswordValidation.hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                  </div>
                    Kleinbuchstaben (a-z)
                  </div>
                  <div className={`flex items-center text-sm ${newPasswordValidation.hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                      <div className={`w-4 h-4 mr-2 rounded-full flex items-center justify-center ${newPasswordValidation.hasUppercase ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                    <Check className={`h-3 w-3 ${newPasswordValidation.hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                  </div>
                    Großbuchstaben (A-Z)
                  </div>
                  <div className={`flex items-center text-sm ${newPasswordValidation.hasNumbers ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                      <div className={`w-4 h-4 mr-2 rounded-full flex items-center justify-center ${newPasswordValidation.hasNumbers ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                    <Check className={`h-3 w-3 ${newPasswordValidation.hasNumbers ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                  </div>
                    Zahlen (0-9)
                  </div>
                  <div className={`flex items-center text-sm ${newPasswordValidation.hasSymbols ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                      <div className={`w-4 h-4 mr-2 rounded-full flex items-center justify-center ${newPasswordValidation.hasSymbols ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                    <Check className={`h-3 w-3 ${newPasswordValidation.hasSymbols ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                  </div>
                    Sonderzeichen (!@#$%^&*)
                  </div>
                </div>
              </div>
            )}

            {/* Passwort-Stärke Indikator */}
            {newPassword && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Passwort-Stärke:</span>
                  <span className={`font-bold ${
                    newPasswordValidation.isValid && passwordsMatch
                      ? 'text-green-600 dark:text-green-400'
                      : newPassword.length >= 6
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {newPasswordValidation.isValid && passwordsMatch
                      ? 'Sehr Stark'
                      : newPassword.length >= 6
                      ? 'Mittel'
                      : 'Schwach'
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ease-out ${
                      newPasswordValidation.isValid && passwordsMatch
                        ? 'bg-green-500'
                        : newPassword.length >= 6
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        ((newPasswordValidation.hasMinLength ? 20 : 0) +
                         (newPasswordValidation.hasLowercase ? 20 : 0) +
                         (newPasswordValidation.hasUppercase ? 20 : 0) +
                         (newPasswordValidation.hasNumbers ? 20 : 0) +
                         (newPasswordValidation.hasSymbols ? 20 : 0)) * (passwordsMatch ? 1 : 0.5)
                      )}%`
                    }}
                  />
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isLoading || !currentPassword || !newPassword || !confirmPassword || !newPasswordValidation.isValid || !passwordsMatch}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    Wird geändert...
                  </div>
                ) : (
                  'Passwort ändern'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 