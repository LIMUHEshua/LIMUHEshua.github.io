# 输出图片的铅笔画版本
import gradio as gr
import numpy as np
import cv2


def image_to_sketch(image):
    gray_image = image.convert("L")
    inverted_image = 255 - np.array(gray_image)
    blurred = cv2.GaussianBlur(inverted_image, (21, 21), 0)
    inverted_blurred = 255 - blurred
    pencil_sketch = cv2.divide(np.array(gray_image), inverted_blurred, scale=256.0)
    return pencil_sketch


demo = gr.Interface(
    fn=image_to_sketch,
    inputs=[gr.Image(label="上传图片", type="pil")],
    outputs=[gr.Image(label="铅笔画")],
    title="图片上传",
    description="将上传的图片转化为铅笔画",
)
demo.launch()
# 该版本原创非本人，仅供学习交流使用，如有侵权请联系删除
# 感谢使用！如果您有任何问题或建议，请随时联系我。
# 该web应用使用Gradio库创建，允许用户上传图片并将其转换为铅笔画版本。用户界面包括一个图片上传组件和一个显示铅笔画结果的组件。核心功能通过OpenCV库实现图像处理，将输入的彩色图片转换为灰度图像，进行反转、模糊处理，再次反转并进行除法运算以生成铅笔画效果。
# 该代码示例展示了如何使用Gradio创建一个简单的图像处理应用，用户可以通过上传图片来体验图像转换的效果。
