export class AuthManager {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.user = null;
    this._unsubscribe = null;
  }

  async signIn(email, password) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    this.user = data.user;
    return data.session;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw new Error(error.message);
    this.user = null;
  }

  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) throw new Error(error.message);
    return data.session;
  }

  onAuthStateChange(callback) {
    const { data } = this.supabase.auth.onAuthStateChange((event, session) => {
      this.user = session?.user || null;
      callback(event, this.user);
    });
    this._unsubscribe = data.subscription;
    return () => {
      this._unsubscribe?.unsubscribe();
    };
  }

  destroy() {
    this._unsubscribe?.unsubscribe();
  }
}
