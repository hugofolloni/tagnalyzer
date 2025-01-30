const Header = () => {

    const redirectToHomepage = () => {
        if(window.location.href.split('/')[3].length > 0) {
            window.location.href = '/'
        }
    }

    return ( 
        <div className="header">
                <h1 onClick={() => redirectToHomepage()} className='title'>tagnalyzer</h1>
        </div>
     );
}
 
export default Header;