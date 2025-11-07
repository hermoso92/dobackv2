using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.Runtime.CompilerServices;
using System.Windows.Forms;
using IncliGraph_V1._1_Pro.My;
using Microsoft.VisualBasic.CompilerServices;

namespace IncliGraph_V1._1_Pro;

[DesignerGenerated]
public class estado_disp : Form
{
	private IContainer components;

	[CompilerGenerated]
	[AccessedThroughProperty("Button1")]
	private Button _Button1;

	[CompilerGenerated]
	[AccessedThroughProperty("Button2")]
	private Button _Button2;

	internal virtual Button Button1
	{
		[CompilerGenerated]
		get
		{
			return _Button1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button1_Click;
			Button button = _Button1;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button1 = value;
			button = _Button1;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual Button Button2
	{
		[CompilerGenerated]
		get
		{
			return _Button2;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button2_Click;
			Button button = _Button2;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button2 = value;
			button = _Button2;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("TextBox1")]
	internal virtual TextBox TextBox1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	public estado_disp()
	{
		base.Load += estado_disp_Load;
		InitializeComponent();
	}

	[DebuggerNonUserCode]
	protected override void Dispose(bool disposing)
	{
		try
		{
			if (disposing && components != null)
			{
				components.Dispose();
			}
		}
		finally
		{
			base.Dispose(disposing);
		}
	}

	[System.Diagnostics.DebuggerStepThrough]
	private void InitializeComponent()
	{
		this.Button1 = new System.Windows.Forms.Button();
		this.Button2 = new System.Windows.Forms.Button();
		this.TextBox1 = new System.Windows.Forms.TextBox();
		base.SuspendLayout();
		this.Button1.Location = new System.Drawing.Point(12, 338);
		this.Button1.Name = "Button1";
		this.Button1.Size = new System.Drawing.Size(156, 23);
		this.Button1.TabIndex = 0;
		this.Button1.Text = "Copiar a Portapapeles";
		this.Button1.UseVisualStyleBackColor = true;
		this.Button2.Location = new System.Drawing.Point(313, 338);
		this.Button2.Name = "Button2";
		this.Button2.Size = new System.Drawing.Size(75, 23);
		this.Button2.TabIndex = 1;
		this.Button2.Text = "Cerrar";
		this.Button2.UseVisualStyleBackColor = true;
		this.TextBox1.Location = new System.Drawing.Point(12, 12);
		this.TextBox1.Multiline = true;
		this.TextBox1.Name = "TextBox1";
		this.TextBox1.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
		this.TextBox1.Size = new System.Drawing.Size(376, 320);
		this.TextBox1.TabIndex = 2;
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 13f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(392, 375);
		base.Controls.Add(this.TextBox1);
		base.Controls.Add(this.Button2);
		base.Controls.Add(this.Button1);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedToolWindow;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "estado_disp";
		base.ShowIcon = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
		this.Text = "Estado del dispositivo";
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	private void Button1_Click(object sender, EventArgs e)
	{
		if (Operators.CompareString(MyProject.Forms.Carga_Datos.Estado_Datos_Cargados, "", TextCompare: false) != 0)
		{
			MyProject.Computer.Clipboard.SetText(MyProject.Forms.Carga_Datos.Estado_Datos_Cargados);
		}
	}

	private void estado_disp_Load(object sender, EventArgs e)
	{
		TextBox1.Text = MyProject.Forms.Carga_Datos.Estado_Datos_Cargados;
	}

	private void Button2_Click(object sender, EventArgs e)
	{
		Close();
	}
}
