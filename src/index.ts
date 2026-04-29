import { validateXML } from 'xmllint-wasm/index-browser.mjs';
import type { XMLFileInfo, XMLValidationError } from 'xmllint-wasm';

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => {
      const reason = reader.error?.message ?? 'Unknown file read error';
      reject(new Error(`Failed to read file "${file.name}": ${reason}`));
    };
    reader.readAsText(file);
  });
}

function setStatus(message: string, type: 'idle' | 'loading' | 'success' | 'error') {
  const el = document.getElementById('status')!;
  el.textContent = message;
  el.className = `status ${type}`;
}

function renderErrors(errors: string[]) {
  const container = document.getElementById('errors')!;
  container.innerHTML = '';
  errors.forEach((err) => {
    const li = document.createElement('li');
    li.textContent = err;
    container.appendChild(li);
  });
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }

  if (err instanceof Event) {
    const asErrorEvent = err as ErrorEvent;
    if (typeof asErrorEvent.message === 'string' && asErrorEvent.message.trim().length > 0) {
      return asErrorEvent.message;
    }

    return 'Validation worker failed to start. Please use a modern Chromium-based browser (Chrome/Edge) and retry.';
  }

  if (typeof err === 'string') {
    return err;
  }

  if (err && typeof err === 'object') {
    const possibleMessage = (err as { message?: unknown }).message;
    if (typeof possibleMessage === 'string' && possibleMessage.trim().length > 0) {
      return possibleMessage;
    }

    const possibleReason = (err as { reason?: unknown }).reason;
    if (typeof possibleReason === 'string' && possibleReason.trim().length > 0) {
      return possibleReason;
    }

    try {
      const serialized = JSON.stringify(err);
      if (serialized && serialized !== '{}' && serialized !== '{"isTrusted":true}') {
        return serialized;
      }
    } catch {
      // ignore serialization errors and continue fallback path
    }
  }

  return 'Unknown validation error';
}

async function handleValidate() {
  const xmlInput = document.getElementById('xml-file') as HTMLInputElement;
  const xsdInput = document.getElementById('xsd-files') as HTMLInputElement;

  if (!xmlInput.files || xmlInput.files.length === 0) {
    setStatus('Please select an XML file.', 'error');
    return;
  }

  setStatus('Validating…', 'loading');
  renderErrors([]);

  try {
    const xmlContent = await readFileAsText(xmlInput.files[0]);

    const schemaFiles: XMLFileInfo[] = [];
    if (xsdInput.files && xsdInput.files.length > 0) {
      for (const file of Array.from(xsdInput.files)) {
        schemaFiles.push({
          fileName: file.name,
          contents: await readFileAsText(file),
        });
      }
    }

    const result = await validateXML(
      schemaFiles.length > 0
        ? (() => {
            const globeRootSignature = 'xsd:element name="GLOBE_OECD"';
            const globeNamespaceSignature = 'targetNamespace="urn:oecd:ties:globe:v2"';
            const mainSchemaIndex = Math.max(
              schemaFiles.findIndex(
                (file) => typeof file.contents === 'string' && file.contents.includes(globeRootSignature)
              ),
              schemaFiles.findIndex(
                (file) => typeof file.contents === 'string' && file.contents.includes(globeNamespaceSignature)
              )
            );
            const resolvedMainIndex = mainSchemaIndex >= 0 ? mainSchemaIndex : 0;
            const mainSchema = schemaFiles[resolvedMainIndex];
            const preload = schemaFiles.filter((_, index) => index !== resolvedMainIndex);

            return {
              xml: [{ fileName: xmlInput.files[0].name, contents: xmlContent }],
              // xmllint resolves schemaLocation by file name, so pass the main schema
              // plus any dependencies via preload.
              schema: mainSchema,
              preload,
            };
          })()
        : {
            xml: [{ fileName: xmlInput.files[0].name, contents: xmlContent }],
            normalization: 'format',
          }
    );

    if (result.valid) {
      setStatus('✅ XML is valid against all provided schema(s).', 'success');
    } else {
      const errors = result.errors
        .map((validationError: XMLValidationError) => {
          const message =
            typeof validationError.message === 'string' ? validationError.message.trim() : 'Unknown schema validation error';
          const lineNumber = validationError.loc?.lineNumber;
          return lineNumber != null ? `Line ${lineNumber}: ${message}` : message;
        })
        .filter((message: string) => message.length > 0);
      setStatus(`❌ XML is NOT valid. ${errors.length} error(s) found:`, 'error');
      renderErrors(errors);
    }
  } catch (err) {
    setStatus(`Error: ${getErrorMessage(err)}`, 'error');
  }
}

document.getElementById('validate-btn')!.addEventListener('click', handleValidate);
