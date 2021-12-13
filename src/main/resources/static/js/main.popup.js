let isAdmin, username;
$(document).ready(() => {
	isAdmin = Security.hasRole('ADMIN');
	username = Security.getName();

	Rest.Html.get(reqParam.target, function (html) {
		$('#wrap_body').html(html);
	});
});

window.onerror = function (e) {
	if (e.toString() === 'ResizeObserver loop limit exceeded') {
		return;
	} else {
		loading.error('Error: ' + e);
	}
	console.error('Error name[' + e.name + '] message[' + e.message + '] toString[' + e.toString() + ']', e);
};
