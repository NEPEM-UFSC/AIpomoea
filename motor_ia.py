# motor_ia.py
import sys
import json
import time
import os

def processar_imagem(caminho):
    """
    Simulação de processamento de IA.
    Em um cenário real, aqui entraria o carregamento do modelo TensorFlow/Keras.
    """
    # Verifica se o arquivo existe (Padrão Media Offline do Neto)
    if not os.path.exists(caminho):
        raise FileNotFoundError(f"Arquivo não encontrado: {caminho}")

    # Simula o tempo de inferência da rede neural
    time.sleep(0.5) 
    
    # Retorna dados simulados baseados no tipo de arquivo ou aleatórios
    return {
        "area_foliar_cm2": round(30 + (time.time() % 20), 2),
        "perimetro_cm": round(15 + (time.time() % 10), 2),
        "saude_indice": round(0.7 + (time.time() % 0.3), 2),
        "status": "processado"
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "erro", "erro": "Nenhum arquivo de lote fornecido."}))
        sys.exit(1)

    caminho_json = sys.argv[1]
    
    try:
        with open(caminho_json, 'r', encoding='utf-8') as f:
            amostras = json.load(f)
    except Exception as e:
        print(json.dumps({"status": "erro", "erro": f"Erro ao ler lote: {str(e)}"}))
        sys.exit(1)
        
    for amostra in amostras:
        try:
            # Processa a imagem
            resultados = processar_imagem(amostra['caminho'])
            
            # Formata a resposta JSON para o Node.js
            resposta = {
                "id": amostra['id'],
                "status": "sucesso",
                "dados": resultados
            }
        except Exception as e:
            resposta = {
                "id": amostra['id'],
                "status": "erro",
                "erro": str(e)
            }
            
        # O PRINT é a ponte IPC. Usamos flush para garantir o envio imediato.
        print(json.dumps(resposta))
        sys.stdout.flush()
