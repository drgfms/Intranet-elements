$(document).ready(function () {
	const welcomeText = '** Temporary note pad here **`;

	const darkmodeText = 'Enable dark mode';
	const lightmodeText = 'Enable light mode';
	const darkMetaColor = '#0d1117';
	const lightMetaColor = '#795548';
	const metaThemeColor = document.querySelector('meta[name=theme-color]');

	if (localStorage.getItem('note') && localStorage.getItem('note') != '') {
		const noteItem = localStorage.getItem('note');
		$('#note').val(noteItem);
	} else {
		$('#note').val(welcomeText);
	}

	if (!localStorage.getItem('isUserPreferredTheme')) {
		localStorage.setItem('isUserPreferredTheme', 'false');
	}

	if (localStorage.getItem('mode') && localStorage.getItem('mode') !== '') {
		if (localStorage.getItem('mode') === 'dark') {
			enableDarkMode(lightmodeText, darkMetaColor, metaThemeColor)
		} else {
			enableLightMode(darkmodeText, lightMetaColor, metaThemeColor)
		}
	}

	$('#note').keyup(debounce(function () {
		localStorage.setItem('note', $(this).val());
	}, 500));

	$('#clearNotes').on('click', function () {
		Swal.fire({
			title: 'Want to delete notes?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Delete'
		}).then((result) => {
			if (result.value) {
				$('#note').val('').focus();
				localStorage.setItem('note', '');

				Swal.fire(
					'Deleted!',
					'Your notes has been deleted.',
					'success'
				)
			}
		})
	});

	$('#mode').click(function () {
		$(document.body).toggleClass('dark');
		let bodyClass = $(document.body).attr('class');

		if (bodyClass === 'dark') {
			enableDarkMode(lightmodeText, darkMetaColor, metaThemeColor)
		} else {
			enableLightMode(darkmodeText, lightMetaColor, metaThemeColor)
		}

		localStorage.setItem('isUserPreferredTheme', 'true');
	});

	$('#copyToClipboard').click(function () {
		navigator.clipboard.writeText($('#note').val()).then(function () {
			showToast('Notes copied to clipboard!')
		}, function () {
			showToast('Failure to copy. Check permissions for clipboard.')
		});
	})

	$('#downloadNotes').click(function () {
		saveTextAsFile(note.value, getFileName());
	})

	// This changes the application's theme when 
	// user toggles device's theme preference
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ({ matches }) => {
		// To override device's theme preference
		// if user sets theme manually in the app
		if (localStorage.getItem('isUserPreferredTheme') === 'true') {
			return;
		}

		if (matches) {
			enableDarkMode(lightmodeText, darkMetaColor, metaThemeColor)
		} else {
			enableLightMode(darkmodeText, lightMetaColor, metaThemeColor)
		}
	});

	// This sets the application's theme based on
	// the device's theme preference when it loads
	if (localStorage.getItem('isUserPreferredTheme') === 'false') {
		if (
			window.matchMedia('(prefers-color-scheme: dark)').matches
		) {
			enableDarkMode(lightmodeText, darkMetaColor, metaThemeColor)
		} else {
			enableLightMode(darkmodeText, lightMetaColor, metaThemeColor)
		}
	}

	if (getPWADisplayMode() === 'standalone') {
		$('#installApp').hide();
	}

	window.matchMedia('(display-mode: standalone)').addEventListener('change', ({ matches }) => {
		if (matches) {
			$('#installApp').hide();
		} else {
			$('#installApp').show();
		}
	});

	document.onkeydown = function (event) {
		event = event || window.event;

		if (event.key === 'Escape') {
			$('#aboutModal').modal('hide');
		} else if (event.ctrlKey && event.code === 'KeyS') {
			saveTextAsFile(note.value, getFileName());
			event.preventDefault();
		}
	};
});

// Registering ServiceWorker
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('sw.js').then(function (registration) {
		console.log('ServiceWorker registration successful with scope: ', registration.scope);
	}).catch(function (err) {
		console.log('ServiceWorker registration failed: ', err);
	});
}

let deferredPrompt;
let installSource;

window.addEventListener('beforeinstallprompt', (e) => {
	$('.install-app-btn-container').show();
	deferredPrompt = e;
	installSource = 'nativeInstallCard';

	e.userChoice.then(function (choiceResult) {
		if (choiceResult.outcome === 'accepted') {
			deferredPrompt = null;
		}

		ga('send', {
			hitType: 'event',
			eventCategory: 'pwa-install',
			eventAction: 'native-installation-card-prompted',
			eventLabel: installSource,
			eventValue: choiceResult.outcome === 'accepted' ? 1 : 0
		});
	});
});

const installApp = document.getElementById('installApp');

installApp.addEventListener('click', async () => {
	installSource = 'customInstallationButton';

	if (deferredPrompt !== null) {
		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === 'accepted') {
			deferredPrompt = null;
		}

		ga('send', {
			hitType: 'event',
			eventCategory: 'pwa-install',
			eventAction: 'custom-installation-button-clicked',
			eventLabel: installSource,
			eventValue: outcome === 'accepted' ? 1 : 0
		});
	} else {
		showToast('Notepad is already installed.')
	}
});

window.addEventListener('appinstalled', () => {
	deferredPrompt = null;

	const source = installSource || 'browser';

	ga('send', 'event', 'pwa-install', 'installed', source);
});
