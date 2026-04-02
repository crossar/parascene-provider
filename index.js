let capabilities = null;

// Load saved token on page load
window.addEventListener('DOMContentLoaded', () => {
	const savedToken = localStorage.getItem('parascene_api_token');
	if (savedToken) {
		document.getElementById('authToken').value = savedToken;
		fetchCapabilities();
	}

	document.getElementById('authToken').addEventListener('input', (e) => {
		localStorage.setItem('parascene_api_token', e.target.value);
	});
});

function toggleJson(toggle) {
	toggle.classList.toggle('expanded');
	const content = toggle.nextElementSibling;
	content.classList.toggle('expanded');
}

function escapeHtml(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function renderMessage(type, text) {
	return `<div class="${type}">${escapeHtml(text)}</div>`;
}

function createFieldHelp(text) {
	if (!text) return null;
	const help = document.createElement('small');
	help.className = 'field-help';
	help.textContent = text;
	help.style.display = 'block';
	help.style.marginTop = '6px';
	help.style.opacity = '0.85';
	return help;
}

async function fetchCapabilities() {
	const token = document.getElementById('authToken').value.trim();
	const resultDiv = document.getElementById('getResult');

	if (!token) {
		resultDiv.innerHTML = renderMessage('error', 'Please enter an API token');
		return;
	}

	resultDiv.innerHTML = '<p>Fetching capabilities...</p>';

	try {
		const response = await fetch('/api', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		const data = await response.json();

		if (!response.ok) {
			resultDiv.innerHTML = renderMessage(
				'error',
				`Error ${response.status}: ${data.message || data.error || 'Request failed'}`
			);
			return;
		}

		capabilities = data;

		resultDiv.innerHTML = `
			${renderMessage('success', '✓ Authenticated successfully')}
			<div class="json-toggle" onclick="toggleJson(this)">Capabilities JSON Response</div>
			<div class="json-content"><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre></div>
		`;

		const methodSelect = document.getElementById('method');
		methodSelect.innerHTML = '<option value="">Select a method...</option>';

		const methodKeys = Object.keys(data.methods || {});
		for (const [key, method] of Object.entries(data.methods || {})) {
			const option = document.createElement('option');
			option.value = key;
			option.textContent = `${method.name} (${method.credits} credits)`;
			methodSelect.appendChild(option);
		}

		if (methodKeys.length > 0) {
			methodSelect.value = methodKeys[0];
			updateMethodFields();
		}

		document.getElementById('generationSection').style.display = 'block';
	} catch (error) {
		resultDiv.innerHTML = renderMessage('error', `Error: ${error.message}`);
	}
}

function updateMethodFields() {
	const methodKey = document.getElementById('method').value;
	const fieldsDiv = document.getElementById('methodFields');
	const generateBtn = document.getElementById('generateBtn');

	fieldsDiv.innerHTML = '';

	if (!methodKey || !capabilities) {
		generateBtn.disabled = true;
		return;
	}

	const method = capabilities.methods[methodKey];
	if (!method) {
		generateBtn.disabled = true;
		return;
	}

	if (method.description) {
		const descCard = document.createElement('div');
		descCard.className = 'method-description-card';
		descCard.style.marginBottom = '18px';
		descCard.style.padding = '14px 16px';
		descCard.style.borderRadius = '10px';
		descCard.style.background = 'rgba(255,255,255,0.03)';
		descCard.style.border = '1px solid rgba(255,255,255,0.08)';
		descCard.innerHTML = `
			<div style="font-size: 13px; opacity: 0.7; margin-bottom: 4px;">Method Description</div>
			<div>${escapeHtml(method.description)}</div>
		`;
		fieldsDiv.appendChild(descCard);
	}

	const fields = method.fields || {};

	if (Object.keys(fields).length > 0) {
		const fieldGroup = document.createElement('div');
		fieldGroup.className = 'field-group';
		fieldGroup.style.display = 'grid';
		fieldGroup.style.gap = '14px';

		for (const [fieldName, fieldDef] of Object.entries(fields)) {
			const formGroup = document.createElement('div');
			formGroup.className = 'form-group';
			formGroup.style.marginBottom = '0';

			const label = document.createElement('label');
			label.setAttribute('for', `field_${fieldName}`);
			label.textContent = `${fieldDef.label || fieldName}${fieldDef.required ? ' *' : ''}`;
			label.style.display = 'block';
			label.style.marginBottom = '6px';
			formGroup.appendChild(label);

			let input;

			if (fieldDef.type === 'select') {
				input = document.createElement('select');

				const placeholder = document.createElement('option');
				placeholder.value = '';
				placeholder.textContent = fieldDef.required
					? 'Select one...'
					: 'Optional';
				input.appendChild(placeholder);

				const options = Array.isArray(fieldDef.options) ? fieldDef.options : [];

				for (const opt of options) {
					const optionEl = document.createElement('option');
					optionEl.value = opt.value;
					optionEl.textContent = opt.label ?? opt.value;

					if (
						fieldDef.default !== undefined &&
						fieldDef.default === opt.value
					) {
						optionEl.selected = true;
					}

					input.appendChild(optionEl);
				}
			} else if (fieldDef.type === 'text') {
				input = document.createElement('textarea');
				input.rows = 3;
			} else if (fieldDef.type === 'url') {
				input = document.createElement('input');
				input.type = 'url';
				input.autocapitalize = 'off';
				input.autocomplete = 'off';
				input.spellcheck = false;
			} else if (fieldDef.type === 'color') {
				input = document.createElement('input');
				input.type = 'color';
			} else if (fieldDef.type === 'number') {
				input = document.createElement('input');
				input.type = 'number';
			} else {
				input = document.createElement('input');
				input.type = 'text';
			}

			input.id = `field_${fieldName}`;
			input.name = fieldName;
			input.className = 'method-input';

			if (fieldDef.required) {
				input.required = true;
			}

			if (fieldDef.default !== undefined && fieldDef.type !== 'select') {
				input.value = fieldDef.default;
			}

			if (fieldDef.type !== 'color' && fieldDef.type !== 'select') {
				input.placeholder = fieldDef.required ? 'Required' : 'Optional';
			}

			formGroup.appendChild(input);

			const help = createFieldHelp(fieldDef.description);
			if (help) formGroup.appendChild(help);

			if (fieldName === 'image_url') {
				const previewWrap = document.createElement('div');
				previewWrap.style.marginTop = '10px';

				const preview = document.createElement('img');
				preview.style.maxWidth = '100%';
				preview.style.maxHeight = '220px';
				preview.style.borderRadius = '10px';
				preview.style.display = 'none';
				preview.style.border = '1px solid rgba(255,255,255,0.08)';

				input.addEventListener('input', () => {
					const v = input.value.trim();
					if (!v) {
						preview.removeAttribute('src');
						preview.style.display = 'none';
						return;
					}
					preview.src = v;
					preview.style.display = 'block';
				});

				previewWrap.appendChild(preview);
				formGroup.appendChild(previewWrap);
			}

			fieldGroup.appendChild(formGroup);
		}

		fieldsDiv.appendChild(fieldGroup);
	}

	generateBtn.disabled = false;
}

function collectArgs(method) {
	const args = {};

	for (const [fieldName, fieldDef] of Object.entries(method.fields || {})) {
		const input = document.getElementById(`field_${fieldName}`);
		if (!input) continue;

		const raw = String(input.value ?? '').trim();
		if (!raw) continue;

		if (fieldDef?.type === 'number') {
			const n = Number(raw);
			if (!Number.isFinite(n)) continue;

			if (fieldName === 'scale') {
				args[fieldName] = Math.max(1, Math.floor(n));
			} else {
				args[fieldName] = n;
			}
		} else {
			args[fieldName] = raw;
		}
	}

	return args;
}

async function generateImage() {
	const token = document.getElementById('authToken').value.trim();
	const methodKey = document.getElementById('method').value;
	const resultDiv = document.getElementById('postResult');

	if (!token || !methodKey) {
		resultDiv.innerHTML = renderMessage('error', 'Please select a method');
		return;
	}

	const method = capabilities.methods[methodKey];
	const args = collectArgs(method);

	resultDiv.innerHTML = '<p>Generating image...</p>';

	try {
		const response = await fetch('/api', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				method: methodKey,
				args,
			}),
		});

		if (!response.ok) {
			const text = await response.text();
			resultDiv.innerHTML = renderMessage(
				'error',
				`Error ${response.status}: ${text}`
			);
			return;
		}

		const blob = await response.blob();
		const imageUrl = URL.createObjectURL(blob);

		const width = response.headers.get('X-Image-Width');
		const height = response.headers.get('X-Image-Height');
		const color = response.headers.get('X-Image-Color');

		resultDiv.innerHTML = `
			${renderMessage('success', '✓ Image generated successfully')}
			<div class="result-card" style="margin-top: 14px; padding: 14px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
				<p style="margin-top: 0;">
					<strong>Dimensions:</strong> ${escapeHtml(width || '?')}x${escapeHtml(height || '?')}
					${color ? ` | <strong>Color:</strong> ${escapeHtml(color)}` : ''}
				</p>
				<img
					id="imageResult"
					src="${imageUrl}"
					alt="Generated image"
					style="display:block; width:100%; max-width:720px; border-radius:12px; margin-top:12px;"
				/>
			</div>
		`;
	} catch (error) {
		resultDiv.innerHTML = renderMessage('error', `Error: ${error.message}`);
	}
}

// Expose functions globally for inline event handlers
window.fetchCapabilities = fetchCapabilities;
window.toggleJson = toggleJson;
window.updateMethodFields = updateMethodFields;
window.generateImage = generateImage;
