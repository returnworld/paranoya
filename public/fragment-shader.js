// Фрагментный шейдер для Мандельброта
window.fragmentShaderSource = `
    precision highp float;
    
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform int u_iterations;
    uniform float u_zoom;
    uniform float u_speed;
    
    varying vec2 v_uv;
    
    // Математические утилиты
    vec2 cmul(vec2 a, vec2 b) {
        return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
    }
    
    mat2 rot(float a) {
        float c = cos(a), s = sin(a);
        return mat2(c, s, -s, c);
    }
    
    void main() {
        // Базовый цвет
        vec3 col = vec3(0.0);
        
        // Антиалиасинг: 2x2 сэмплинг
        #define AA 2
        for(int j=0; j<AA; j++){
            for(int i=0; i<AA; i++){
                
                // Смещение для антиалиасинга
                vec2 fragCoord = gl_FragCoord.xy + vec2(float(i), float(j))/float(AA);
                
                // Нормализованные координаты
                vec2 p = (fragCoord - u_resolution.xy * 0.5) / u_resolution.y;
                
                // Время для анимации
                float ttm = cos(sin(u_time * u_speed / 8.0)) * 6.2831;
               
                // Поворот и трансформация координат
                p *= rot(ttm);
                p -= vec2(cos(u_time * u_speed / 2.0)/2.0, sin(u_time * u_speed / 3.0)/5.0);
                 
                // Масштабирование и позиционирование
                float zm = (200.0 + sin(u_time * u_speed / 7.0) * 50.0) * u_zoom;
                vec2 cc = vec2(-0.57735 + 0.004, 0.57735) + p/zm;
     
                // Инициализация позиции и производной
                vec2 z = vec2(0.0), dz = vec2(0.0);
                
                // Итерации Мандельброта
                int ik = u_iterations;
                float bailout = 1.0 / 0.005;
                 
                for(int k=0; k<300; k++){
                    if(k >= u_iterations) break;
                    
                    // Вычисление производной: dz = 2 * z * dz + 1
                    dz = cmul(z, dz) * 2.0 + vec2(1.0, 0.0);
                    
                    // Обновление позиции: z = z * z + c
                    z = cmul(z, z) + cc;
                    
                    // Проверка на выход из множества
                    if(dot(z, z) > bailout){
                        ik = k;
                        break;
                    }
                }
                
                // Вычисление линий и затенения
                float ln = step(0.0, length(z)/15.5 - 1.0);
                
                // Расстояние и затенение
                float d = sqrt(1.0/max(length(dz), 0.0001)) * log(dot(z, z));
                d = clamp(d * 50.0, 0.0, 1.0);
                
                // Направление для слоев
                float dir = mod(float(ik), 2.0) < 0.5 ? -1.0 : 1.0;
                
                // Затенение
                float sh = float(u_iterations - ik)/float(u_iterations);
                vec2 tuv = z/320.0;
                
                // Поворот координат для параллакса
                float tm = (-ttm * sh * sh * 16.0);
                tuv *= rot(tm);
                tuv = abs(mod(tuv, 1.0/8.0) - 1.0/16.0);
              
                // Создание паттерна круговой сетки
                float pat = smoothstep(0.0, 1.0/length(dz), length(tuv) - 1.0/32.0);
                pat = min(pat, smoothstep(0.0, 1.0/length(dz), abs(max(tuv.x, tuv.y) - 1.0/16.0) - 0.04/16.0));
                
                // Цвет слоя
                vec3 lCol = pow(min(vec3(1.5, 1.0, 1.0)*min(d*0.85, 0.96), 1.0), vec3(1.0, 3.0, 16.0)) * 1.15;
                
                // Применение паттерна
                if(dir < 0.0) {
                    lCol *= min(pat, ln);
                } else {
                    lCol = (sqrt(lCol) * 0.5 + 0.7) * max(1.0 - pat, 1.0 - ln);
                }
                
                // Фейковое освещение
                vec3 rd = normalize(vec3(p, 1.0));
                rd = reflect(rd, vec3(0.0, 0.0, -1.0));
                float diff = clamp(dot(z * 0.5 + 0.5, rd.xy), 0.0, 1.0) * d;
                
                // Фейковый отражающий паттерн
                tuv = z/200.0;
                tm = -tm/1.5 + 0.5;
                tuv *= rot(tm);
                tuv = abs(mod(tuv, 1.0/8.0) - 1.0/16.0);
                pat = smoothstep(0.0, 1.0/length(dz), length(tuv) - 1.0/32.0);
                pat = min(pat, smoothstep(0.0, 1.0/length(dz), abs(max(tuv.x, tuv.y) - 1.0/16.0) - 0.04/16.0));
                
                // Добавление фейкового глянца
                lCol += mix(lCol, vec3(1.0) * ln, 0.5) * diff * diff * 0.5 * (pat * 0.6 + 0.6);
                
                // Перестановка цветов на каждом шестом слое
                if(mod(float(ik), 6.0) < 0.5) {
                    lCol = lCol.yxz;
                }
                lCol = mix(lCol.xzy, lCol, d/1.2);
                
                // Добавление черных краевых линий
                float edgeFactor = 1.0 - step(0.0, -(length(z) * 0.05 * float(ik)/float(u_iterations) - 1.0));
                lCol = mix(lCol, vec3(0.0), edgeFactor * 0.95);
               
                // Применение тумана
                vec3 fog = vec3(0.0);
                lCol = mix(fog, lCol, sh * d);
                
                // Добавляем к общему цвету
                col += min(lCol, 1.0);
            }
        }
        
        // Делим на количество сэмплов
        col /= float(AA * AA);
        
        // Применяем квадратный корень для финального тона
        col = sqrt(max(col, 0.0));
        
        // Виньетирование
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        col *= pow(16.0 * (1.0 - uv.x) * (1.0 - uv.y) * uv.x * uv.y, 1.0/8.0) * 1.15;
        
        gl_FragColor = vec4(col, 1.0);
    }
`;