export function useCaptcha() {
	let token = $state('');
	let resetWidget = $state<() => void>(() => {});
	let executeWidget = $state<() => void>(() => {});

	function setToken(value: string) {
		token = value;
	}

	function registerReset(reset: () => void) {
		resetWidget = reset;
	}

	function registerExecute(execute: () => void) {
		executeWidget = execute;
	}

	function execute() {
		executeWidget();
	}

	function reset() {
		token = '';
		resetWidget();
	}

	return {
		get token() {
			return token;
		},
		setToken,
		registerReset,
		registerExecute,
		execute,
		reset
	};
}
