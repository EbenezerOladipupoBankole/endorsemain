import React, { useMemo, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { storage } from "@/components/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";

// Register custom fonts
// Quill.import() is typed as `unknown` for format paths; 'formats/font' is a
// ClassAttributor whose whitelist controls the allowed font values.
const Font = Quill.import('formats/font') as { whitelist: string[] };
Font.whitelist = [
  'sans-serif', 
  'serif', 
  'monospace', 
  'jakarta', 
  'inter', 
  'playfair', 
  'georgia', 
  'times-new-roman',
  'arial',
  'verdana',
  'courier-new'
];
Quill.register('formats/font', Font, true);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const quillRef = useRef<ReactQuill>(null);

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const toastId = toast.loading("Uploading image...");
      try {
        const storageRef = ref(storage, `blog_content/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        
        const quill = quillRef.current?.getEditor();
        const range = quill?.getSelection();
        if (quill && range) {
          quill.insertEmbed(range.index, 'image', url);
          quill.setSelection(range.index + 1, 0);
        }
        toast.success("Image uploaded", { id: toastId });
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error("Failed to upload image", { id: toastId });
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': Font.whitelist }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image', 'video', 'code-block'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), []);

  const formats = [
    'header', 'font',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet', 'align',
    'link', 'image', 'video', 'code-block'
  ];

  return (
    <div className="rich-text-editor">
      <style>{`
        /* Font families */
        .ql-font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
        .ql-font-inter { font-family: 'Inter', sans-serif; }
        .ql-font-playfair { font-family: 'Playfair Display', serif; }
        .ql-font-georgia { font-family: Georgia, serif; }
        .ql-font-times-new-roman { font-family: 'Times New Roman', Times, serif; }
        .ql-font-arial { font-family: Arial, Helvetica, sans-serif; }
        .ql-font-verdana { font-family: Verdana, Geneva, sans-serif; }
        .ql-font-courier-new { font-family: 'Courier New', Courier, monospace; }

        /* Toolbar picker labels */
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item::before {
          content: 'Default';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="serif"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="serif"]::before {
          content: 'Serif';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="monospace"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="monospace"]::before {
          content: 'Monospace';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="jakarta"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="jakarta"]::before {
          content: 'Jakarta';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="inter"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="inter"]::before {
          content: 'Inter';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="playfair"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="playfair"]::before {
          content: 'Playfair';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="georgia"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="georgia"]::before {
          content: 'Georgia';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="times-new-roman"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="times-new-roman"]::before {
          content: 'Times New Roman';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="arial"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="arial"]::before {
          content: 'Arial';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="verdana"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="verdana"]::before {
          content: 'Verdana';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="courier-new"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="courier-new"]::before {
          content: 'Courier New';
        }

        .rich-text-editor .ql-container {
          min-height: 400px;
          font-size: 20px;
          border: none !important;
          background: transparent;
          font-family: 'Times New Roman', Times, serif;
        }
        .rich-text-editor .ql-toolbar {
          border: none !important;
          border-bottom: 1px solid #e5e7eb !important;
          background: #ffffff;
          position: sticky;
          top: 64px;
          z-index: 40;
          padding: 12px 0 !important;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #b3b3b1;
          font-style: normal;
          left: 0;
        }
        .rich-text-editor .ql-editor {
          line-height: 1.8;
          padding: 1rem 0;
          color: #242424;
        }
        .rich-text-editor .ql-editor p {
          margin-bottom: 1em;
        }
        .rich-text-editor .ql-editor h1, 
        .rich-text-editor .ql-editor h2 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
      `}</style>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
};


export default RichTextEditor;
