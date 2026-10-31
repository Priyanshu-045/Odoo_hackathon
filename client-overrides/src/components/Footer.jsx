// Author: Priyanshu Pandey | Enrollment: 0801e1241068
// Rendered once by App.jsx on EVERY screen (login + dashboard), independent of data/auth state.
export default function Footer() {
  return (
    <footer
      data-testid="app-footer"
      className="mt-auto w-full border-t border-gray-200 bg-white px-4 pt-4 text-center text-xs text-gray-500 sm:text-sm"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      Architect: Priyanshu Pandey | 0801e1241068
    </footer>
  );
}
