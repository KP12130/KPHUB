export const getReputationTitle = (rep) => {
    if (rep >= 5000) return { title: "Nexus God", color: "text-purple-500", glow: "shadow-[0_0_15px_rgba(168,85,247,0.5)]" };
    if (rep >= 2500) return { title: "Neon Architect", color: "text-neon-blue", glow: "shadow-[0_0_10px_rgba(0,212,255,0.3)]" };
    if (rep >= 1000) return { title: "Senior Cyber-Dev", color: "text-neon-green", glow: "shadow-[0_0_8px_rgba(57,255,20,0.2)]" };
    if (rep >= 500) return { title: "Code Runner", color: "text-white", glow: "" };
    if (rep >= 100) return { title: "Grid Citizen", color: "text-gray-400", glow: "" };
    return { title: "Novice_Protocol", color: "text-gray-600", glow: "" };
};
