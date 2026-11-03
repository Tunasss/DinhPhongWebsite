# Modern Reskin, Auth System & Multi-Category Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Đình Phong Apple inventory management app with a modern Pro-Max UI/UX powered by GSAP animations, a secure login & Admin account creation system, and a 3-choice category workflow (MacBook, iPad, Khác/Phụ kiện) before uploading.

**Architecture:** 
1. **Auth Service & State:** Create `src/services/authService.ts` managing user session, credential storage in localStorage (with pre-seeded Admin), and role-based permissions (Admin vs Staff). Wrap app in an authenticated container: if unauthenticated, show a luxury Apple-styled Login screen; once authenticated, all accounts have full add/edit/delete powers, and Admin has a dedicated Account Management modal.
2. **Category Model & Filter Expansion:** Extend `DeviceCategory` in `src/types.ts` to include `'Khác'` (Phụ kiện Apple: Magic Keyboard, Pencil, Mouse, AirPods...). Update `CategoryFilterBar` to allow 1-click filtering by MacBook, iPad, Phụ kiện/Khác.
3. **Step 0 3-Way Selector in AddEditDeviceModal:** Redesign Step 0 with 3 visually stunning cards (MacBook, iPad, Khác/Phụ kiện). For accessories, provide specialized fields (no need for OS spec screenshots or RAM/Chip, directly upload exterior photos and accessory details).
4. **GSAP Pro-Max UI/UX Reskin:** Integrate GSAP + `@gsap/react` for card grid staggers, smooth modal entrances, floating stats, and micro-interactions adhering to `gsap-performance` rules (transforms & opacity only, 60fps). Redesign Navbar, CategoryFilterBar, DeviceCard, and Modals with luxury dark-glassmorphism.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Lucide React, GSAP 3, @gsap/react.

---

### Task 1: Auth Service & User Management Model
- [ ] Create `src/services/authService.ts` with User interface (`id`, `username`, `password`, `displayName`, `role: 'admin' | 'staff'`, `createdAt`, `isActive`).
- [ ] Seed default admin account (`admin` / `admin123` or customizable) if no accounts exist.
- [ ] Provide methods: `getCurrentUser()`, `login(username, password)`, `logout()`, `getAllUsers()`, `createUser(userData)`, `updateUser(id, data)`, `deleteUser(id)`.
- [ ] Verify auth methods work with local persistence.

### Task 2: Login Screen & Admin Account Management Modal
- [ ] Create `src/components/LoginScreen.tsx` with a high-end luxury dark glassmorphism design, brand logo, username/password inputs, clear error feedback, and quick-fill helper.
- [ ] Create `src/components/UserManagementModal.tsx` for Admin: list all accounts, add new account with role selection, change password, and toggle active status.
- [ ] Add user profile badge & account management trigger in `Navbar.tsx`.
- [ ] Protect `App.tsx` so only logged-in users can see inventory and tools.

### Task 3: Support "Khác / Phụ kiện" (Magic Keyboard, Pencil, etc.)
- [ ] Update `src/types.ts`: extend `DeviceCategory` to `'MacBook' | 'iPad' | 'Khác'`. Add accessory product lines (`Magic Keyboard`, `Apple Pencil`, `Magic Mouse`, `AirPods`, `Khác`).
- [ ] Update `CategoryFilterBar.tsx` to include "Phụ kiện & Khác" in tabs and product line dropdowns.
- [ ] Update `AddEditDeviceModal.tsx` Step 0: 3 choices (💻 MacBook, 📱 iPad, ⌨️ Khác / Phụ kiện).
- [ ] Tailor Step 1 & 2 for accessories: skip OCR spec requirement, simplify specs (no RAM/Chip/Storage required), highlight accessory type & condition.
- [ ] Update `DeviceCard.tsx` and `DeviceDetailModal.tsx` to render accessory cards cleanly (smart badges instead of chip/ram).

### Task 4: GSAP Pro-Max UI/UX Reskin & Micro-Interactions
- [ ] Register GSAP plugins & setup `useGSAP` in main view and components.
- [ ] Add staggered entrance animations for device cards in `App.tsx` and `DeviceCard.tsx`.
- [ ] Elevate visual styling with modern luxury Apple-style dark glassmorphism, glowing borders, smooth hover transforms, and refined badges.
- [ ] Animate modals (Login, Add/Edit, User Management, Details) with smooth backdrop blur and scale-up transitions.
- [ ] Ensure full responsiveness and accessibility (`prefers-reduced-motion`).

### Task 5: Testing & Build Verification
- [ ] Verify `npm run build` passes with zero TypeScript and Vite errors.
- [ ] Verify complete login flow: login with admin, create a staff account, logout, login with new staff account, test add/edit/delete device.
- [ ] Verify adding a "Khác / Phụ kiện" device (e.g. Magic Keyboard or Apple Pencil) and filtering by it.
- [ ] Verify GSAP animations run smoothly at 60fps without layout shifts.

