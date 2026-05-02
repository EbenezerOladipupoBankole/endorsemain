import React, { useMemo, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { storage } from "@/components/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";

// Register custom fonts
const Font = Quill.import('formats/font');
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
Quill.register(Font, true);

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
          font-size: 16px;
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          background: white;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          background: #f9fafb;
          border-color: #e5e7eb;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        .rich-text-editor .ql-editor {
          line-height: 1.6;
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
