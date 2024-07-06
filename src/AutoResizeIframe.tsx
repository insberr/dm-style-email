import { useEffect, useRef } from 'preact/compat';

// Function to decode base64 to UTF-8
// This converts all those weird characters back into what they should be
const base64ToUtf8 = (base64: string) => {
    const binaryString = atob(base64);
    return new TextDecoder('utf-8').decode(Uint8Array.from(binaryString, char => char.charCodeAt(0)));
};

export default function AutoResizeIframe(props: { src: string }) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (iframe) {
            const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDocument) {
                const decodedHtml = base64ToUtf8(props.src);

                iframeDocument.open();
                iframeDocument.write(decodedHtml);
                iframeDocument.close();

                setTimeout(() => {
                    let height = iframeDocument.body.scrollHeight;
                    const offset = iframeDocument.body.offsetHeight;
                    height = Math.max(height, offset);

                    iframe.style.height = (height + 40).toString() + "px";
                }, 2000);
            }
        }
    }, [props.src]);

    return (
        <iframe
            ref={iframeRef}
            // scrolling="no"
            style={{ width: '100%', height: '500px', border: 'none', overflow: 'hidden' }}
            title="Render HTML"
        />
    );
};
