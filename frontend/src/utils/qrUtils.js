export function saveQrCode(qrCode, filename = "qrcode.png") {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${qrCode}`;
    link.download = filename;
    link.click();
}

export async function copyQrCode(qrCode) {
    const res = await fetch(`data:image/png;base64,${qrCode}`);
    const blob = await res.blob();
    await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
    ]);
}
