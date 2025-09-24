const Admin = require("../models/Admin");

const hasPermission = async (adminId, moduleName, action) => {
    try {
        console.log("adminId"+adminId);
        const admin = await Admin.findByPk(adminId);
        console.log(admin);

        if (!admin) return false;

        // Super admin check (role = 1)
        if (admin.role == 1) return true;

        // Parse permissions JSON
        const permissions = typeof admin.permission === "string" 
            ? JSON.parse(admin.permission) 
            : admin.permission;

        // Check module exists
        if (!permissions[moduleName]) return false;

        // Full access overrides
        if (permissions[moduleName].full === "1") return true;

        // Check specific action
        return permissions[moduleName][action] === "1";
    } catch (err) {
        console.error("Permission check error:", err);
        return false;
    }
};
module.exports = { hasPermission };
