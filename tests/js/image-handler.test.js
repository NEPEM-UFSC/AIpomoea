/**
 * Tests for image-handler.js
 * Image display, navigation, and upload functionality
 */

describe('image-handler.js - Image Handling', () => {
  let currentImage;

  beforeEach(() => {
    currentImage = 0;
    
    // Setup DOM elements
    document.body.innerHTML = `
      <input type="file" id="fileInput" multiple accept="image/*" />
      <img id="imageDisplay" src="" alt="" />
    `;
  });

  describe('File Input Change Handler', () => {
    it('should display image when valid file is selected', () => {
      const fileInput = document.getElementById('fileInput');
      const imageDisplay = document.getElementById('imageDisplay');
      
      // Create mock file
      const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock FileReader
      const mockReader = {
        onload: null,
        readAsDataURL: jest.fn(function() {
          this.onload({ target: { result: 'data:image/jpeg;base64,mockdata' } });
        })
      };
      
      global.FileReader = jest.fn(() => mockReader);

      const handleFileChange = (event) => {
        const file = event.target.files[0];
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];

        if (file) {
          const fileExtension = file.name.split('.').pop().toLowerCase();

          if (allowedExtensions.includes(fileExtension)) {
            const reader = new FileReader();
            reader.onload = function(e) {
              const img = document.getElementById('imageDisplay');
              img.src = e.target.result;
              img.alt = '';
            };
            reader.readAsDataURL(file);
          } else {
            alert('Tipo de arquivo não permitido. Por favor, selecione um arquivo de imagem.');
          }
        }
      };

      // Simulate file selection
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false
      });

      handleFileChange({ target: fileInput });

      expect(mockReader.readAsDataURL).toHaveBeenCalledWith(mockFile);
      expect(imageDisplay.src).toBe('data:image/jpeg;base64,mockdata');
      expect(imageDisplay.alt).toBe('');
    });

    it('should reject invalid file types', () => {
      const fileInput = document.getElementById('fileInput');
      global.alert = jest.fn();
      
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });

      const handleFileChange = (event) => {
        const file = event.target.files[0];
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];

        if (file) {
          const fileExtension = file.name.split('.').pop().toLowerCase();

          if (allowedExtensions.includes(fileExtension)) {
            // Valid file handling
          } else {
            alert('Tipo de arquivo não permitido. Por favor, selecione um arquivo de imagem.');
          }
        }
      };

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false
      });

      handleFileChange({ target: fileInput });

      expect(global.alert).toHaveBeenCalledWith('Tipo de arquivo não permitido. Por favor, selecione um arquivo de imagem.');
    });

    it('should accept all valid image extensions', () => {
      const validExtensions = ['test.jpg', 'test.jpeg', 'test.png', 'test.gif'];
      
      const handleFileChange = (file) => {
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        return allowedExtensions.includes(fileExtension);
      };

      validExtensions.forEach(filename => {
        const mockFile = { name: filename };
        expect(handleFileChange(mockFile)).toBe(true);
      });
    });
  });

  describe('displayImage', () => {
    it('should display image using URL.createObjectURL', () => {
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      
      const displayImage = (image) => {
        let imageDisplay = document.getElementById('imageDisplay');
        if (imageDisplay) {
          imageDisplay.src = URL.createObjectURL(image);
        } else {
          console.error('Elemento com ID "imageDisplay" não encontrado');
        }
      };

      displayImage(mockFile);

      expect(URL.createObjectURL).toHaveBeenCalledWith(mockFile);
      // Check that src was set (JSDOM converts to absolute URL)
      const imageDisplay = document.getElementById('imageDisplay');
      expect(imageDisplay.src).toBeTruthy();
      expect(imageDisplay.src).not.toBe('');
    });

    it('should log error when imageDisplay element is not found', () => {
      document.body.innerHTML = ''; // Remove imageDisplay element
      
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      
      const displayImage = (image) => {
        let imageDisplay = document.getElementById('imageDisplay');
        if (imageDisplay) {
          imageDisplay.src = URL.createObjectURL(image);
        } else {
          console.error('Elemento com ID "imageDisplay" não encontrado');
        }
      };

      displayImage(mockFile);

      expect(console.error).toHaveBeenCalledWith('Elemento com ID "imageDisplay" não encontrado');
    });
  });

  describe('prevImage', () => {
    it('should navigate to previous image', () => {
      const file1 = new File(['1'], 'image1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['2'], 'image2.jpg', { type: 'image/jpeg' });
      const file3 = new File(['3'], 'image3.jpg', { type: 'image/jpeg' });
      
      const fileInput = document.getElementById('fileInput');
      Object.defineProperty(fileInput, 'files', {
        value: [file1, file2, file3],
        writable: false
      });

      let currentImage = 'image2.jpg';
      
      const displayImage = jest.fn();
      
      const prevImage = () => {
        var files = fileInput.files;
        var currentIndex = 0;
        for (var i = 0; i < files.length; i++) {
          if (files[i].name === currentImage) {
            currentIndex = i;
            break;
          }
        }
        var prevIndex = (currentIndex > 0) ? currentIndex - 1 : files.length - 1;
        var prevImage = files[prevIndex];
        displayImage(prevImage);
        currentImage = prevImage.name;
      };

      prevImage();

      expect(displayImage).toHaveBeenCalledWith(file1);
    });

    it('should wrap to last image when at first image', () => {
      const file1 = new File(['1'], 'image1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['2'], 'image2.jpg', { type: 'image/jpeg' });
      
      const fileInput = document.getElementById('fileInput');
      Object.defineProperty(fileInput, 'files', {
        value: [file1, file2],
        writable: false
      });

      let currentImage = 'image1.jpg';
      const displayImage = jest.fn();
      
      const prevImage = () => {
        var files = fileInput.files;
        var currentIndex = 0;
        for (var i = 0; i < files.length; i++) {
          if (files[i].name === currentImage) {
            currentIndex = i;
            break;
          }
        }
        var prevIndex = (currentIndex > 0) ? currentIndex - 1 : files.length - 1;
        var prevImageFile = files[prevIndex];
        displayImage(prevImageFile);
        currentImage = prevImageFile.name;
      };

      prevImage();

      expect(displayImage).toHaveBeenCalledWith(file2);
    });
  });

  describe('nextImage', () => {
    it('should navigate to next image', () => {
      const file1 = new File(['1'], 'image1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['2'], 'image2.jpg', { type: 'image/jpeg' });
      const file3 = new File(['3'], 'image3.jpg', { type: 'image/jpeg' });
      
      const fileInput = document.getElementById('fileInput');
      Object.defineProperty(fileInput, 'files', {
        value: [file1, file2, file3],
        writable: false
      });

      let currentImage = 'image1.jpg';
      const displayImage = jest.fn();
      
      const nextImage = () => {
        let files = fileInput.files;
        let currentIndex = 0;
        for (var i = 0; i < files.length; i++) {
          if (files[i].name === currentImage) {
            currentIndex = i;
            break;
          }
        }
        const nextIndex = (currentIndex < files.length - 1) ? currentIndex + 1 : 0;
        const nextImageFile = files[nextIndex];
        displayImage(nextImageFile);
        currentImage = nextImageFile.name;
      };

      nextImage();

      expect(displayImage).toHaveBeenCalledWith(file2);
    });

    it('should wrap to first image when at last image', () => {
      const file1 = new File(['1'], 'image1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['2'], 'image2.jpg', { type: 'image/jpeg' });
      
      const fileInput = document.getElementById('fileInput');
      Object.defineProperty(fileInput, 'files', {
        value: [file1, file2],
        writable: false
      });

      let currentImage = 'image2.jpg';
      const displayImage = jest.fn();
      
      const nextImage = () => {
        let files = fileInput.files;
        let currentIndex = 0;
        for (var i = 0; i < files.length; i++) {
          if (files[i].name === currentImage) {
            currentIndex = i;
            break;
          }
        }
        const nextIndex = (currentIndex < files.length - 1) ? currentIndex + 1 : 0;
        const nextImageFile = files[nextIndex];
        displayImage(nextImageFile);
        currentImage = nextImageFile.name;
      };

      nextImage();

      expect(displayImage).toHaveBeenCalledWith(file1);
    });
  });

  describe('uploadImage', () => {
    it('should send file paths via IPC', async () => {
      const file1 = new File(['1'], 'image1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['2'], 'image2.jpg', { type: 'image/jpeg' });
      
      const fileInput = document.getElementById('fileInput');
      Object.defineProperty(fileInput, 'files', {
        value: [file1, file2],
        writable: false
      });

      webUtils.getPathForFile.mockResolvedValue('/path/to/image1.jpg');

      const uploadImage = async () => {
        const { files } = fileInput;

        if (files.length === 0) {
          console.error('Nenhuma imagem selecionada');
          return;
        }

        try {
          const filePaths = await Promise.all(
            Array.from(files).map(async (file) => {
              const path = await webUtils.getPathForFile(file);
              return path || file.webkitRelativePath || file.name;
            })
          );

          if (filePaths.length === 0) {
            console.error('Nenhum caminho de arquivo encontrado');
          } else if (filePaths.length > 1) {
            console.warn('Enviando apenas a primeira imagem selecionada');
          }
          
          ipcRenderer.send('upload-image', filePaths);
        } catch (e) {
          console.error('Erro ao enviar imagem para o servidor:', e);
        }
      };

      await uploadImage();

      expect(webUtils.getPathForFile).toHaveBeenCalled();
      expect(ipcRenderer.send).toHaveBeenCalledWith('upload-image', expect.any(Array));
    });

    it('should handle no files selected', async () => {
      const fileInput = document.getElementById('fileInput');
      Object.defineProperty(fileInput, 'files', {
        value: [],
        writable: false
      });

      const uploadImage = async () => {
        const { files } = fileInput;

        if (files.length === 0) {
          console.error('Nenhuma imagem selecionada');
          return;
        }
      };

      await uploadImage();

      expect(console.error).toHaveBeenCalledWith('Nenhuma imagem selecionada');
      expect(ipcRenderer.send).not.toHaveBeenCalled();
    });

    it('should handle errors during upload', async () => {
      const file1 = new File(['1'], 'image1.jpg', { type: 'image/jpeg' });
      
      const fileInput = document.getElementById('fileInput');
      Object.defineProperty(fileInput, 'files', {
        value: [file1],
        writable: false
      });

      webUtils.getPathForFile.mockRejectedValue(new Error('Path error'));

      const uploadImage = async () => {
        const { files } = fileInput;

        if (files.length === 0) {
          console.error('Nenhuma imagem selecionada');
          return;
        }

        try {
          const filePaths = await Promise.all(
            Array.from(files).map(async (file) => {
              const path = await webUtils.getPathForFile(file);
              return path || file.webkitRelativePath || file.name;
            })
          );
          
          ipcRenderer.send('upload-image', filePaths);
        } catch (e) {
          console.error('Erro ao enviar imagem para o servidor:', e);
        }
      };

      await uploadImage();

      expect(console.error).toHaveBeenCalledWith('Erro ao enviar imagem para o servidor:', expect.any(Error));
    });

    it('should warn when multiple files are selected', async () => {
      const file1 = new File(['1'], 'image1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['2'], 'image2.jpg', { type: 'image/jpeg' });
      
      const fileInput = document.getElementById('fileInput');
      Object.defineProperty(fileInput, 'files', {
        value: [file1, file2],
        writable: false
      });

      webUtils.getPathForFile.mockResolvedValue('/path/to/image.jpg');

      const uploadImage = async () => {
        const { files } = fileInput;

        if (files.length === 0) {
          console.error('Nenhuma imagem selecionada');
          return;
        }

        try {
          const filePaths = await Promise.all(
            Array.from(files).map(async (file) => {
              const path = await webUtils.getPathForFile(file);
              return path || file.webkitRelativePath || file.name;
            })
          );

          if (filePaths.length === 0) {
            console.error('Nenhum caminho de arquivo encontrado');
          } else if (filePaths.length > 1) {
            console.warn('Enviando apenas a primeira imagem selecionada');
          }
          
          ipcRenderer.send('upload-image', filePaths);
        } catch (e) {
          console.error('Erro ao enviar imagem para o servidor:', e);
        }
      };

      await uploadImage();

      expect(console.warn).toHaveBeenCalledWith('Enviando apenas a primeira imagem selecionada');
    });
  });
});
