/**
 * flay.index.js
 */

var isAdmin = Security.hasRole("ADMIN");

$(document).ready(function() {
	
	var bgThemeValue = LocalStorageItem.get('flay.bgtheme', 'D');
	$("body").toggleClass("bg-dark", bgThemeValue === 'D');
	
	Rest.Html.get(reqParam.target, function(html) {
		$("#wrap_body").html(html);
	});

});

window.onerror = function(e) {
    console.error('Error', e);
    loading.on('Error: ' + e);
};
