import { useAuth } from "./AuthContext";

const ProProgressBar = () => {
  const { user } = useAuth();
  
  // Default to 0 if undefined
  const signedCount = user?.signedDocumentsCount || 0;
  const target = 3;
  
  // Check if already Pro
  const isPro = user?.isPro || signedCount >= target;

  // If already Pro, show a success badge
  if (isPro) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
        <div className="flex items-center text-green-700">
          <span className="font-semibold">Pro Status Active</span>
        </div>
        <p className="text-sm text-green-600 mt-1">
          You have unlimited access to all features.
        </p>
      </div>
    );
  }

  const percentage = Math.min((signedCount / target) * 100, 100);
  const remaining = target - signedCount;

  return (
    <div className="w-full p-4 bg-white border rounded-lg shadow-sm mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700">Unlock Pro Status</h3>
        <span className="text-xs font-semibold text-blue-600">
          {signedCount}/{target} Documents
        </span>
      </div>
      
      {/* Progress Bar Track */}
      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
        {/* Progress Bar Fill */}
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      <p className="text-xs text-gray-500">
        Sign <span className="font-bold text-gray-700">{remaining}</span> more document{remaining !== 1 ? 's' : ''} to automatically upgrade to Pro.
      </p>
    </div>
  );
};

export default ProProgressBar;