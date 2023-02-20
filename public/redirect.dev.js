
function redirect () {
    setTimeout(() => {
        window.location.href = `https://app-dev.lomads.xyz${window.location.pathname.replace('/share', '')}`
    }, 500)
}
window.onload = redirect; 