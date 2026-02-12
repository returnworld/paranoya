// WebGL версия шейдера Мандельброта с GLSL
class MandelbrotWebGL {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            alert('WebGL не поддерживается в этом браузере');
            return;
        }

        // Параметры
        this.time = 0;
        this.iterations = 128;
        this.zoom = 1.0;
        this.speed = 1.0;
        
        // Настройка полноэкранного режима
        this.setupFullscreen();
        
        // Инициализация
        this.init();
    }

    setupFullscreen() {
        // Устанавливаем размер канваса равным размеру окна
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Устанавливаем WebGL viewport сразу после установки размера canvas
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Обновляем размер при изменении окна
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            // Обновляем WebGL viewport
            if (this.gl) {
                this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            }
        });
        
        // Функция переключения полноэкранного режима
        this.toggleFullscreen = () => {
            try {
                if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
                    // Вход в полноэкранный режим
                    if (document.documentElement.requestFullscreen) {
                        document.documentElement.requestFullscreen();
                    } else if (document.documentElement.webkitRequestFullscreen) {
                        document.documentElement.webkitRequestFullscreen();
                    } else if (document.documentElement.msRequestFullscreen) {
                        document.documentElement.msRequestFullscreen();
                    }
                } else {
                    // Выход из полноэкранного режима
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    }
                }
            } catch (error) {
                console.error('Ошибка при переключении полноэкранного режима:', error);
            }
        };
        
        // Привязываем к событиям пользователя
        document.addEventListener('click', this.toggleFullscreen);
        document.addEventListener('keydown', (e) => {
            // Выход из полноэкранного режима по клавише Escape
            if (e.key === 'Escape') {
                this.toggleFullscreen();
            }
        });
        
        // Обработка изменения полноэкранного режима
        document.addEventListener('fullscreenchange', () => {
            // Обновляем размер canvas при изменении полноэкранного режима
            setTimeout(() => {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
                if (this.gl) {
                    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
                }
            }, 100);
        });
        
        // Обработка изменения размера окна
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            if (this.gl) {
                this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            }
        });
    }

    init() {
        // Инициализация шейдеров
        this.initShaders();
        
        // Создание геометрии
        this.initGeometry();
        
        // Запуск рендеринга
        this.animate();
    }

    initShaders() {
        const gl = this.gl;
        
        // Вершинный шейдер
        const vertexShaderSource = `
            attribute vec2 a_position;
            varying vec2 v_uv;
            
            void main() {
                v_uv = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

        // Компиляция шейдеров
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, window.fragmentShaderSource);

        // Создание программы
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Ошибка линковки программы:', gl.getProgramInfoLog(this.program));
            return;
        }

        // Получение атрибутов и юниформов
        this.a_position = gl.getAttribLocation(this.program, 'a_position');
        this.u_resolution = gl.getUniformLocation(this.program, 'u_resolution');
        this.u_time = gl.getUniformLocation(this.program, 'u_time');
        this.u_iterations = gl.getUniformLocation(this.program, 'u_iterations');
        this.u_zoom = gl.getUniformLocation(this.program, 'u_zoom');
        this.u_speed = gl.getUniformLocation(this.program, 'u_speed');
    }

    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Ошибка компиляции шейдера:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    initGeometry() {
        const gl = this.gl;
        
        // Создаем квад для полноэкранного рендеринга
        const vertices = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    }


    render() {
        const gl = this.gl;
        
        // Очистка экрана
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Использование программы
        gl.useProgram(this.program);

        // Привязка буфера вершин
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(this.a_position);
        gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);

        // Установка юниформов
        gl.uniform2f(this.u_resolution, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.u_time, this.time);
        gl.uniform1i(this.u_iterations, this.iterations);
        gl.uniform1f(this.u_zoom, this.zoom);
        gl.uniform1f(this.u_speed, this.speed);

        // Рендеринг
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    animate() {
        const startTime = Date.now();
        
        const animateFrame = () => {
            this.time = (Date.now() - startTime) / 1000.0;
            
            this.render();
            
            requestAnimationFrame(animateFrame);
        };
        
        animateFrame();
    }
}

// Инициализация при загрузке страницы
window.addEventListener('load', () => {
    const canvas = document.getElementById('glCanvas');
    if (canvas) {
        new MandelbrotWebGL(canvas);
    }
});