/** The one account that gets the Assessment tab. The Firestore rules check the same email. */
export const ADMIN_EMAIL = "hajunk105@gmail.com";

export const isAdminEmail = (email: string | null | undefined) => email?.toLowerCase() === ADMIN_EMAIL;
