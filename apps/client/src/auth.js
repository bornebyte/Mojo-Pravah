export const getAuth = () => {
    const userRaw = localStorage.getItem("volley_user");
    const token = localStorage.getItem("volley_token");

    if (!userRaw || !token) return { user: null, token: null };
    return { user: JSON.parse(userRaw), token };
};

export const saveAuth = ({ user, token }) => {
    localStorage.setItem("volley_user", JSON.stringify(user));
    localStorage.setItem("volley_token", token);
};

export const clearAuth = () => {
    localStorage.removeItem("volley_user");
    localStorage.removeItem("volley_token");
};
