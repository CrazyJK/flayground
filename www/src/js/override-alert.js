/**
 * override native function
 */

var nativeAlert = window.alert;

window.alert = function(msg) {
	
	var isMobile = /Mobile/i.test(navigator.userAgent);
	var isIframe = parent.injectJS;
	
	if (isMobile && isIframe) 
	{
		console.log("mobile", "iframe", msg);
	} 
	else if (isMobile && !isIframe) 
	{
		console.log("mobile", "parent", msg);
		nativeAlert(msg);
	} 
	else if (!isMobile && isIframe) 
	{
		console.log("pc", "iframe", msg);
	} 
	else 
	{
		console.log("pc", "parent", msg);
		nativeAlert(msg);
	}
};
