function ResetPage(){
    return(
        <div className="card">
            <h1>Password reset</h1>
            <p>Enter your email</p>
            <form>
                <label>Email</label>
                <input required type="email" placeholder="you@example.com" />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}
export default ResetPage;