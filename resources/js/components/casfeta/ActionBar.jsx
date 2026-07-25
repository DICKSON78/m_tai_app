import { X, Save } from 'lucide-react';

export default function ActionBar({ onCancel, onCancelLabel = 'Cancel', onSubmit, onSubmitLabel = 'Save', loading = false, accent = false }) {
    return (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 text-sm"
            >
                <X size={16} />
                {onCancelLabel}
            </button>
            <button
                type="submit"
                onClick={onSubmit}
                disabled={loading}
                className={`px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50 ${
                    accent
                        ? 'bg-gradient-to-r from-[#00D4AA] to-[#00B894] hover:from-[#00B894] hover:to-[#009e80]'
                        : 'bg-[#00D4AA] hover:bg-[#00B894]'
                }`}
            >
                <Save size={16} />
                {loading ? 'Saving...' : onSubmitLabel}
            </button>
        </div>
    );
}
