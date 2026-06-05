// ===== PANITIA MANAGEMENT =====
// Module untuk manage panitia roles dan members

import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();

// Default roles untuk panitia
const DEFAULT_ROLES = [
  { name: 'Dapur', icon: '🍳' },
  { name: 'Parkiran', icon: '🅿️' },
  { name: 'Pamong Tamu', icon: '👋' },
  { name: 'Dekorasi', icon: '✨' },
  { name: 'Sound System', icon: '🎤' },
  { name: 'Transportasi', icon: '🚗' },
  { name: 'Gate', icon: '🚪' },
  { name: 'Makeup Room', icon: '💄' }
];

const Panitia = {
  /**
   * Load all roles for a user
   * @param {string} uid - User ID
   * @returns {Promise<Array>} Array of roles with members
   */
  async loadRoles(uid) {
    try {
      const snap = await getDoc(doc(db, 'panitia', uid));
      if (!snap.exists()) {
        // Initialize with default roles if not exist
        const initialData = {
          roles: DEFAULT_ROLES.map((role, idx) => ({
            id: `role_${idx}_${Date.now()}`,
            name: role.name,
            icon: role.icon,
            members: []
          }))
        };
        await setDoc(doc(db, 'panitia', uid), initialData);
        return initialData.roles;
      }
      return snap.data().roles || [];
    } catch (e) {
      console.error('Error loading roles:', e);
      throw e;
    }
  },

  /**
   * Get all panitia data for a user
   * @param {string} uid - User ID
   * @returns {Promise<Object>} Panitia data with roles and members
   */
  async get(uid) {
    try {
      const snap = await getDoc(doc(db, 'panitia', uid));
      if (!snap.exists()) {
        const initialData = {
          roles: DEFAULT_ROLES.map((role, idx) => ({
            id: `role_${idx}_${Date.now()}`,
            name: role.name,
            icon: role.icon,
            members: []
          }))
        };
        await setDoc(doc(db, 'panitia', uid), initialData);
        return initialData;
      }
      return snap.data();
    } catch (e) {
      console.error('Error fetching panitia:', e);
      return { roles: [] };
    }
  },

  /**
   * Add a new role
   * @param {string} uid - User ID
   * @param {string} name - Role name
   * @param {string} icon - Role icon/emoji
   * @returns {Promise<void>}
   */
  async addRole(uid, name, icon = '👥') {
    try {
      const data = await this.get(uid);
      const newRole = {
        id: `role_${Date.now()}`,
        name,
        icon,
        members: []
      };
      data.roles.push(newRole);
      await setDoc(doc(db, 'panitia', uid), data);
    } catch (e) {
      console.error('Error adding role:', e);
      throw e;
    }
  },

  /**
   * Delete a role
   * @param {string} uid - User ID
   * @param {string} roleId - Role ID to delete
   * @returns {Promise<void>}
   */
  async deleteRole(uid, roleId) {
    try {
      const data = await this.get(uid);
      data.roles = data.roles.filter(r => r.id !== roleId);
      await setDoc(doc(db, 'panitia', uid), data);
    } catch (e) {
      console.error('Error deleting role:', e);
      throw e;
    }
  },

  /**
   * Update role name or icon
   * @param {string} uid - User ID
   * @param {string} roleId - Role ID
   * @param {Object} updated - Updated data (name, icon)
   * @returns {Promise<void>}
   */
  async updateRole(uid, roleId, updated) {
    try {
      const data = await this.get(uid);
      data.roles = data.roles.map(r => 
        r.id === roleId ? { ...r, ...updated } : r
      );
      await setDoc(doc(db, 'panitia', uid), data);
    } catch (e) {
      console.error('Error updating role:', e);
      throw e;
    }
  },

  /**
   * Add a member to a role
   * @param {string} uid - User ID
   * @param {string} roleId - Role ID
   * @param {Object} member - Member data {name, phone}
   * @returns {Promise<void>}
   */
  async addMember(uid, roleId, member) {
    try {
      const data = await this.get(uid);
      const role = data.roles.find(r => r.id === roleId);
      if (!role) throw new Error('Role not found');
      
      role.members.push({
        id: `member_${Date.now()}`,
        name: member.name || 'No Name',
        phone: member.phone || '',
        createdAt: new Date().toISOString()
      });
      
      await setDoc(doc(db, 'panitia', uid), data);
    } catch (e) {
      console.error('Error adding member:', e);
      throw e;
    }
  },

  /**
   * Remove a member from a role
   * @param {string} uid - User ID
   * @param {string} roleId - Role ID
   * @param {string} memberId - Member ID to remove
   * @returns {Promise<void>}
   */
  async removeMember(uid, roleId, memberId) {
    try {
      const data = await this.get(uid);
      const role = data.roles.find(r => r.id === roleId);
      if (!role) throw new Error('Role not found');
      
      role.members = role.members.filter(m => m.id !== memberId);
      
      await setDoc(doc(db, 'panitia', uid), data);
    } catch (e) {
      console.error('Error removing member:', e);
      throw e;
    }
  },

  /**
   * Update a member info
   * @param {string} uid - User ID
   * @param {string} roleId - Role ID
   * @param {string} memberId - Member ID
   * @param {Object} updated - Updated member data
   * @returns {Promise<void>}
   */
  async updateMember(uid, roleId, memberId, updated) {
    try {
      const data = await this.get(uid);
      const role = data.roles.find(r => r.id === roleId);
      if (!role) throw new Error('Role not found');
      
      role.members = role.members.map(m =>
        m.id === memberId ? { ...m, ...updated } : m
      );
      
      await setDoc(doc(db, 'panitia', uid), data);
    } catch (e) {
      console.error('Error updating member:', e);
      throw e;
    }
  },

  /**
   * Get total members count
   * @param {Array} roles - Array of roles
   * @returns {number} Total members
   */
  getTotalMembers(roles) {
    return roles.reduce((total, role) => total + (role.members?.length || 0), 0);
  },

  /**
   * Get members by role
   * @param {Array} roles - Array of roles
   * @param {string} roleName - Role name to filter
   * @returns {Array} Members in that role
   */
  getMembersByRole(roles, roleName) {
    const role = roles.find(r => r.name === roleName);
    return role ? role.members : [];
  }
};

export { Panitia, DEFAULT_ROLES };
