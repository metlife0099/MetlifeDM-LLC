import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { toggleMobileMenu } from '@/store/index.js';
import { useScrollLock } from '@/hooks/index.js';

export default function AdminLayout() {
  const dispatch = useDispatch();
  const mobileOpen = useSelector((s) => s.ui.mobileMenuOpen);
  useScrollLock(mobileOpen);

  return (
    <div className="min-h-screen bg-canvas flex">
      {/* Desktop sidebar */}
      <div className="hidden md:block sticky top-0 h-screen">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-ink/50 md:hidden"
              onClick={() => dispatch(toggleMobileMenu(false))}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-40 w-72 md:hidden"
            >
              <Sidebar mobile onNavigate={() => dispatch(toggleMobileMenu(false))} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
