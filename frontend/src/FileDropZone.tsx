import { useDropzone } from 'react-dropzone';
import './App.css'

function FileDropZone({ onFileUpload, children, className='', ...rest }: { onFileUpload: (file: File) => void, children: React.ReactNode, className?: string }) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        noClick: true,
        noKeyboard: true,
        multiple: false,
        onDrop: (acceptedFiles) => {
            onFileUpload(acceptedFiles[0]);
        },
    });

    return (
        <div
            {...getRootProps()}
            style={{
                background: isDragActive ? 'var(--color-border)' : 'transparent',
                transition: 'background 0.2s'
            }}
            className={ className }
            {...rest}
        >
            <input {...getInputProps()} />
            {children}
        </div>
    )
}

export default FileDropZone;