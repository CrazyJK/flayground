let isAdmin, username;
$(document).ready(() => {
	isAdmin = Security.hasRole('ADMIN');
	username = Security.getName();
	console.info(`User is ${username} ${isAdmin ? 'has ADMIN Role' : ''}`);

	const targetUrl = reqParam.target;
	Rest.Html.get(reqParam.target, (html) => {
		// load page
		$('#wrap_body').html(html);
		// set title
		document.title = targetUrl.split('/').pop();
	});
});

window.onerror = (e) => {
	if (e.toString() === 'ResizeObserver loop limit exceeded') {
		return;
	} else {
		loading.error('Error: ' + e);
	}
	console.error('Error name[' + e.name + '] message[' + e.message + '] toString[' + e.toString() + ']', e);
};
